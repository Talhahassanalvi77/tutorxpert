import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BookOpenIcon,
  VideoCameraIcon,
  CreditCardIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const faqCategories = [
  {
    title: 'Getting Started',
    icon: AcademicCapIcon,
    faqs: [
      {
        question: 'How do I sign up as a tutor?',
        answer: 'Click on "Become a Tutor" in the navigation menu. Fill out the application form with your qualifications, subjects you want to teach, and set your hourly rate. Our team will review your application within 24-48 hours.'
      },
      {
        question: 'How do I book a session with a tutor?',
        answer: 'Browse tutors by subject, read their profiles, check availability, and click "Book Session". Select a time slot that works for you and complete the payment.'
      },
      {
        question: 'What do I need for my first session?',
        answer: 'Ensure you have a stable internet connection, a working microphone and camera, and a quiet space for learning. We recommend using Chrome or Firefox browser.'
      }
    ]
  },
  {
    title: 'Payments & Billing',
    icon: CreditCardIcon,
    faqs: [
      {
        question: 'How does payment work?',
        answer: 'We use Stripe for secure payments. You pay when booking a session, and the funds are held until the session is completed. Tutors receive their earnings within 3-5 business days.'
      },
      {
        question: 'Can I get a refund?',
        answer: 'Yes, you can request a refund if you cancel at least 24 hours before the scheduled session. For no-shows or late cancellations, refund policies vary by tutor.'
      },
      {
        question: 'How do tutors get paid?',
        answer: 'Tutors connect their Stripe account and can request payouts weekly. They receive 80% of the session fee, with 20% going to the platform.'
      }
    ]
  },
  {
    title: 'Technical Support',
    icon: VideoCameraIcon,
    faqs: [
      {
        question: 'The video session is not connecting. What should I do?',
        answer: 'First, check your internet connection. Then, ensure camera and microphone permissions are granted. Try refreshing the page or using a different browser. If issues persist, contact support.'
      },
      {
        question: 'How do I use the interactive tools?',
        answer: 'During a session, you can use the whiteboard, code editor, and file sharing tools. Click the respective icons in the toolbar to switch between tools.'
      },
      {
        question: 'Can I record my sessions?',
        answer: 'Session recording is available for tutors with premium accounts. Learners can request recordings for personal review only.'
      }
    ]
  },
  {
    title: 'Account & Profile',
    icon: UserGroupIcon,
    faqs: [
      {
        question: 'How do I change my profile picture?',
        answer: 'Go to Settings > Profile and click on your profile picture to upload a new one. We recommend using a clear, professional photo.'
      },
      {
        question: 'Can I teach multiple subjects?',
        answer: 'Yes! Tutors can add multiple subjects to their profile. Each subject can have its own hourly rate and availability schedule.'
      },
      {
        question: 'How do I verify my account?',
        answer: 'Tutors can get verified by submitting ID verification and qualification documents. Verified tutors appear with a blue checkmark.'
      }
    ]
  }
];

const helpArticles = [
  {
    title: 'Getting Started with TutorXpert',
    description: 'A complete guide for new users',
    category: 'Basics',
    readTime: '5 min'
  },
  {
    title: 'Teaching Best Practices',
    description: 'Tips for effective online tutoring',
    category: 'For Tutors',
    readTime: '8 min'
  },
  {
    title: 'Using Interactive Tools',
    description: 'Master the whiteboard and code editor',
    category: 'Tools',
    readTime: '6 min'
  },
  {
    title: 'Managing Your Schedule',
    description: 'Set availability and handle bookings',
    category: 'For Tutors',
    readTime: '4 min'
  },
  {
    title: 'Troubleshooting Video Issues',
    description: 'Fix common technical problems',
    category: 'Troubleshooting',
    readTime: '3 min'
  },
  {
    title: 'Understanding Payments',
    description: 'Billing, payouts, and refunds',
    category: 'Billing',
    readTime: '5 min'
  }
];

function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqs, setExpandedFaqs] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');

  const toggleFaq = (index) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const filteredFaqs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How can we help you?
          </h1>
          <p className="text-primary-100 text-lg mb-8">
            Find answers, browse articles, or contact our support team
          </p>
          
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full px-6 py-4 rounded-xl text-neutral-900 text-lg shadow-lg outline-none focus:ring-4 focus:ring-primary-300"
            />
            <QuestionMarkCircleIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-400" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Link
            to="/community"
            className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary-50 group-hover:bg-primary-100 transition-colors">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Ask Community</h3>
                <p className="text-sm text-neutral-500">Get help from other users</p>
              </div>
            </div>
          </Link>

          <a
            href="mailto:support@tutorxpert.com"
            className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <EnvelopeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Email Support</h3>
                <p className="text-sm text-neutral-500">support@tutorxpert.com</p>
              </div>
            </div>
          </a>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-50 group-hover:bg-green-100 transition-colors">
                <PhoneIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Live Chat</h3>
                <p className="text-sm text-neutral-500">Available 24/7</p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Articles */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Popular Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {helpArticles.map((article, index) => (
              <div
                key={index}
                className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                      {article.category}
                    </span>
                    <h3 className="font-medium text-neutral-900 mt-2">{article.title}</h3>
                    <p className="text-sm text-neutral-500 mt-1">{article.description}</p>
                  </div>
                  <DocumentTextIcon className="w-5 h-5 text-neutral-400" />
                </div>
                <p className="text-xs text-neutral-400 mt-3">{article.readTime} read</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Frequently Asked Questions</h2>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              All Questions
            </button>
            {faqCategories.map((category, index) => (
              <button
                key={index}
                onClick={() => setActiveCategory(category.title)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === category.title
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>

          {/* FAQs */}
          <div className="space-y-4">
            {(activeCategory === 'all' ? filteredFaqs : filteredFaqs.filter(c => c.title === activeCategory)).map((category, catIndex) => (
              <div key={catIndex} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-neutral-50 flex items-center gap-3">
                  <category.icon className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-neutral-900">{category.title}</h3>
                </div>
                <div className="divide-y divide-neutral-100">
                  {category.faqs.map((faq, faqIndex) => {
                    const globalIndex = `${catIndex}-${faqIndex}`;
                    return (
                      <div key={faqIndex}>
                        <button
                          onClick={() => toggleFaq(globalIndex)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors"
                        >
                          <span className="font-medium text-neutral-900">{faq.question}</span>
                          {expandedFaqs[globalIndex] ? (
                            <ChevronUpIcon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                          )}
                        </button>
                        {expandedFaqs[globalIndex] && (
                          <div className="px-6 pb-4">
                            <p className="text-neutral-600">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Still need help?</h2>
          <p className="text-primary-100 mb-6">Our support team is here to assist you with any questions</p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-6 py-3 bg-white text-primary-600 font-medium rounded-xl hover:bg-primary-50 transition-colors inline-flex items-center gap-2">
              Contact Support
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpPage;