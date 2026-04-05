import { useState, useEffect } from 'react';
import { communityAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  EyeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { subjectsAPI } from '../services/api';

function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', subjectId: '', tags: '', postType: 'question' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPosts();
    loadSubjects();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await communityAPI.getAll();
      setPosts(res.data.data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await subjectsAPI.getAll();
      setSubjects(res.data.data.subjects || []);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    
    if (!newPost.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!newPost.content.trim()) {
      toast.error('Content is required');
      return;
    }

    setSubmitting(true);
    try {
      const postData = {
        ...newPost,
        tags: newPost.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      await communityAPI.create(postData);
      toast.success('Question posted successfully!');
      setShowForm(false);
      setNewPost({ title: '', content: '', subjectId: '', tags: '', postType: 'question' });
      loadPosts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to post question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (postId) => {
    try {
      await communityAPI.upvote(postId);
      loadPosts();
    } catch (error) {
      console.error('Failed to upvote:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900">Community</h1>
          <p className="text-neutral-600 mt-1">Ask questions, share knowledge</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? (
            <>
              <XMarkIcon className="w-5 h-5" />
              Cancel
            </>
          ) : (
            <>
              <PlusIcon className="w-5 h-5" />
              Ask Question
            </>
          )}
        </button>
      </div>

      {/* New Post Form */}
      {showForm && (
        <form onSubmit={handleSubmitPost} className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Ask a Question</h2>
          <div className="space-y-4">
            <div>
              <label className="input-label">Title *</label>
              <input
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                className="input"
                placeholder="What's your question?"
              />
            </div>
            <div>
              <label className="input-label">Content *</label>
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                className="input min-h-[150px]"
                placeholder="Provide details about your question..."
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Subject</label>
                <select
                  value={newPost.subjectId}
                  onChange={(e) => setNewPost({ ...newPost, subjectId: e.target.value })}
                  className="input"
                >
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s.subject_id} value={s.subject_id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                  className="input"
                  placeholder="e.g., math, homework"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Question'}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search questions..."
          className="input pl-12"
        />
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-neutral-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts
            .filter(
              (p) =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.content.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((post) => (
              <div
                key={post.post_id}
                className="card p-6 hover:shadow-medium transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleUpvote(post.post_id)}
                      className="p-2 hover:bg-neutral-100 rounded-lg"
                    >
                      <HandThumbUpIcon className="w-5 h-5 text-neutral-400" />
                    </button>
                    <span className="text-sm font-medium text-neutral-600">{post.upvotes}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 text-lg">{post.title}</h3>
                    <p className="text-neutral-600 mt-2 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        {post.reply_count || 0} answers
                      </span>
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-4 h-4" />
                        {post.views} views
                      </span>
                      {post.subject_name && (
                        <span className="badge badge-neutral">{post.subject_name}</span>
                      )}
                    </div>
                  </div>
                  <img
                    src={post.author_pic || `https://i.pravatar.cc/50?u=${post.user_id}`}
                    alt={post.author_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <ChatBubbleLeftRightIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">No posts yet</h3>
          <p className="text-neutral-600 mb-4">Be the first to ask a question!</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            Ask Question
          </button>
        </div>
      )}
    </div>
  );
}

export default CommunityPage;
