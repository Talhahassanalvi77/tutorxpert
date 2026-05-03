import { query } from '../db/index.js';
import axios from 'axios';
import { AppError } from '../middleware/errorHandler.js';

// Calculate match score between learner and tutor
const calculateMatchScore = async (learnerId, tutorId) => {
  const scores = [];
  const reasons = [];

  // Get learner profile
  const learnerResult = await query(
    `SELECT * FROM learner_profiles WHERE user_id = $1`,
    [learnerId]
  );

  // Get tutor profile
  const tutorResult = await query(
    `SELECT * FROM tutor_profiles WHERE user_id = $1`,
    [tutorId]
  );

  if (learnerResult.rows.length === 0 || tutorResult.rows.length === 0) {
    return { score: 0, reasons: [] };
  }

  const learner = learnerResult.rows[0];
  const tutor = tutorResult.rows[0];

  // Subject match (40% weight)
  const learnerSubjects = learner.preferred_subjects || [];
  const tutorSubjects = tutor.subjects || [];
  const subjectOverlap = learnerSubjects.filter(s => tutorSubjects.includes(s));
  const subjectScore = subjectOverlap.length > 0 ? (subjectOverlap.length / Math.max(learnerSubjects.length, 1)) * 40 : 0;
  scores.push(subjectScore);
  if (subjectOverlap.length > 0) {
    reasons.push(`Matches ${subjectOverlap.length} of your preferred subjects`);
  }

  // Language match (15% weight)
  const tutorLanguages = tutor.languages || [];
  // Assume learner's language preference is stored or default to English
  const languageMatch = tutorLanguages.length > 0 ? 15 : 0;
  scores.push(languageMatch);
  if (languageMatch > 0) {
    reasons.push(`Speaks ${tutorLanguages.join(', ')}`);
  }

  // Experience match (15% weight)
  const experienceScore = Math.min(tutor.experience_years * 3, 15);
  scores.push(experienceScore);
  if (tutor.experience_years >= 3) {
    reasons.push(`${tutor.experience_years} years of experience`);
  }

  // Rating match (20% weight)
  const ratingScore = (tutor.hourly_rate > 0 ? (parseFloat(tutor.hourly_rate) / 5) * 4 : 0);
  scores.push(Math.min(ratingScore, 20));
  if (parseFloat(tutor.hourly_rate) >= 4) {
    reasons.push(`Highly rated (${tutor.hourly_rate}/5.0 stars)`);
  }

  // Response rate match (10% weight)
  const responseScore = (tutor.response_rate || 0) / 10;
  scores.push(responseScore);
  if (tutor.response_rate >= 80) {
    reasons.push(`Quick responder (${tutor.response_rate}% response rate)`);
  }

  const totalScore = scores.reduce((a, b) => a + b, 0);

  return {
    score: Math.min(totalScore, 100) / 100, // Normalize to 0-1
    reasons
  };
};

// Get AI-powered matches for a learner
export const getMatchesForLearner = async (req, res, next) => {
  try {
    const learnerId = req.query.learnerId || req.user.userId;
    const limit = parseInt(req.query.limit) || 10;

    // Get learner's preferred subjects
    const learnerResult = await query(
      `SELECT preferred_subjects, learning_goals FROM learner_profiles WHERE user_id = $1`,
      [learnerId]
    );

    if (learnerResult.rows.length === 0) {
      throw new AppError('Learner profile not found', 404);
    }

    const preferredSubjects = learnerResult.rows[0].preferred_subjects || [];

    // Get available tutors
    let tutorsQuery;
    let tutorsParams;

    if (preferredSubjects.length > 0) {
      tutorsQuery = `
        SELECT 
          tp.profile_id,
          tp.user_id,
          u.name,
          u.profile_pic,
          u.rating,
          u.total_reviews,
          u.is_verified,
          tp.subjects,
          tp.experience_years,
          tp.hourly_rate,
          tp.languages,
          tp.introduction,
          tp.total_sessions,
          tp.response_rate
        FROM tutor_profiles tp
        JOIN users u ON tp.user_id = u.user_id
        WHERE tp.is_available = true
          AND $1::uuid[] && tp.subjects
        ORDER BY u.rating DESC, tp.total_sessions DESC
        LIMIT $2
      `;
      tutorsParams = [preferredSubjects, limit * 2]; // Get more to filter
    } else {
      tutorsQuery = `
        SELECT 
          tp.profile_id,
          tp.user_id,
          u.name,
          u.profile_pic,
          u.rating,
          u.total_reviews,
          u.is_verified,
          tp.subjects,
          tp.experience_years,
          tp.hourly_rate,
          tp.languages,
          tp.introduction,
          tp.total_sessions,
          tp.response_rate
        FROM tutor_profiles tp
        JOIN users u ON tp.user_id = u.user_id
        WHERE tp.is_available = true
        ORDER BY u.rating DESC, tp.total_sessions DESC
        LIMIT $1
      `;
      tutorsParams = [limit * 2];
    }

    const tutorsResult = await query(tutorsQuery, tutorsParams);
    const tutors = tutorsResult.rows;

    // Calculate match scores for each tutor
    const matches = [];
    for (const tutor of tutors) {
      const matchData = await calculateMatchScore(learnerId, tutor.user_id);
      
      if (matchData.score > 0.3) { // Only include matches with score > 30%
        matches.push({
          tutor,
          score: matchData.score,
          reasons: matchData.reasons
        });
      }
    }

    // Sort by score and limit
    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, limit);

    // Store matches in database - use upsert
    for (const match of topMatches) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      // Check if match exists first
      const existing = await query(
        `SELECT match_id FROM matches WHERE learner_id = $1 AND tutor_id = $2`,
        [learnerId, match.tutor.user_id]
      );

      if (existing.rows.length > 0) {
        // Update existing match
        await query(
          `UPDATE matches SET score = $1, match_reasons = $2, expires_at = $3, status = 'pending'
           WHERE learner_id = $4 AND tutor_id = $5`,
          [match.score, match.reasons, expiresAt, learnerId, match.tutor.user_id]
        );
      } else {
        // Insert new match
        await query(
          `INSERT INTO matches (learner_id, tutor_id, score, match_reasons, expires_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [learnerId, match.tutor.user_id, match.score, match.reasons, expiresAt]
        );
      }
    }

    res.json({
      success: true,
      data: {
        matches: topMatches,
        total: topMatches.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get matches from AI microservice
export const getAIMatches = async (req, res, next) => {
  try {
    const learnerId = req.query.learnerId || req.user.userId;

    // Call AI microservice
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    try {
      const response = await axios.post(`${aiServiceUrl}/api/v1/match/recommend`, {
        learnerId,
        limit: parseInt(req.query.limit) || 10
      });

      res.json({
        success: true,
        data: response.data
      });
    } catch (aiError) {
      // Fallback to local matching if AI service is unavailable
      console.log('AI service unavailable, using fallback matching');
      return getMatchesForLearner(req, res, next);
    }
  } catch (error) {
    next(error);
  }
};

// Accept a match
export const acceptMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;

    const result = await query(
      `UPDATE matches SET status = 'accepted', viewed_by_learner = true
       WHERE match_id = $1 AND learner_id = $2
       RETURNING *`,
      [matchId, req.user.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Match not found', 404);
    }

    // Create notification for tutor
    await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       SELECT 
         tutor_id,
         'match_accepted',
         'Match Accepted!',
         'A learner has accepted your match request.',
         json_build_object('match_id', $1, 'learner_id', $2)
       FROM matches WHERE match_id = $1`,
      [matchId, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Match accepted successfully',
      data: { match: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Reject a match
export const rejectMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;

    const result = await query(
      `UPDATE matches SET status = 'rejected', viewed_by_learner = true
       WHERE match_id = $1 AND learner_id = $2
       RETURNING *`,
      [matchId, req.user.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Match not found', 404);
    }

    res.json({
      success: true,
      message: 'Match rejected',
      data: { match: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Get user's matches
export const getUserMatches = async (req, res, next) => {
  try {
    const { status = 'pending', type } = req.query;
    const userId = req.user.userId;

    let queryText;
    let queryParams;

    if (type === 'sent' || req.user.role === 'tutor') {
      // Matches where user is the tutor
      queryText = `
        SELECT 
          m.*,
          u.name as learner_name,
          u.profile_pic as learner_pic,
          lp.learning_goals,
          lp.preferred_subjects
        FROM matches m
        JOIN users u ON m.learner_id = u.user_id
        LEFT JOIN learner_profiles lp ON m.learner_id = lp.user_id
        WHERE m.tutor_id = $1 AND m.status = $2
        ORDER BY m.created_at DESC
        LIMIT 20
      `;
      queryParams = [userId, status];
    } else {
      // Matches where user is the learner
      queryText = `
        SELECT 
          m.*,
          u.name as tutor_name,
          u.profile_pic as tutor_pic,
          u.rating as tutor_rating,
          tp.subjects as tutor_subjects,
          tp.introduction
        FROM matches m
        JOIN users u ON m.tutor_id = u.user_id
        LEFT JOIN tutor_profiles tp ON m.tutor_id = tp.user_id
        WHERE m.learner_id = $1 AND m.status = $2
        ORDER BY m.score DESC, m.created_at DESC
        LIMIT 20
      `;
      queryParams = [userId, status];
    }

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: { matches: result.rows }
    });
  } catch (error) {
    next(error);
  }
};
