import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  VideoCameraIcon,
  ChartBarIcon,
  UserGroupIcon,
  SparklesIcon,
  CheckCircleIcon,
  StarIcon,
  PlayCircleIcon,
  ArrowRightIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  LanguageIcon,
  CodeBracketIcon,
  BriefcaseIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const features = [
  {
    icon: SparklesIcon,
    title: 'AI-Powered Matching',
    description: 'Get matched with the perfect tutor based on your learning style, goals, and schedule.',
  },
  {
    icon: CalendarIcon,
    title: 'Flexible Scheduling',
    description: 'Book sessions at times that work for you. Reschedule easily when life happens.',
  },
  {
    icon: VideoCameraIcon,
    title: 'Interactive Sessions',
    description: 'Learn with shared whiteboard, code editor, and real-time collaboration tools.',
  },
  {
    icon: ChartBarIcon,
    title: 'Progress Tracking',
    description: 'Track your improvement with detailed analytics and personalized insights.',
  },
  {
    icon: UserGroupIcon,
    title: 'Community Support',
    description: 'Join a community of learners. Ask questions, share knowledge, grow together.',
  },
  {
    icon: CheckCircleIcon,
    title: 'Verified Tutors',
    description: 'All tutors are vetted and verified. Learn from qualified, experienced educators.',
  },
];

const stats = [
  { value: '100,000+', label: 'Experienced tutors' },
  { value: '300,000+', label: '5-star tutor reviews' },
  { value: '120+', label: 'Subjects taught' },
  { value: '180+', label: 'Tutor nationalities' },
  { value: '4.8', label: 'on the App Store', icon: true },
];

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'College Student',
    image: 'https://i.pravatar.cc/100?img=1',
    content: 'TutorXpert helped me ace my calculus exam! My tutor explained concepts so clearly.',
    rating: 5,
  },
  {
    name: 'James L.',
    role: 'Professional',
    image: 'https://i.pravatar.cc/100?img=3',
    content: 'Learning Spanish for work has never been easier. The flexible scheduling is perfect.',
    rating: 5,
  },
  {
    name: 'Emily R.',
    role: 'High School Student',
    image: 'https://i.pravatar.cc/100?img=5',
    content: 'I love the interactive tools! The whiteboard makes learning so much more engaging.',
    rating: 5,
  },
];

const subjects = [
  { name: 'English tutors', tutors: '33,602 teachers', icon: LanguageIcon },
  { name: 'Spanish tutors', tutors: '10,056 teachers', icon: GlobeAltIcon },
  { name: 'French tutors', tutors: '3,714 teachers', icon: GlobeAltIcon },
  { name: 'German tutors', tutors: '1,518 teachers', icon: GlobeAltIcon },
  { name: 'Italian tutors', tutors: '2,542 teachers', icon: GlobeAltIcon },
  { name: 'Chinese tutors', tutors: '5,253 teachers', icon: GlobeAltIcon },
  { name: 'Arabic tutors', tutors: '3,651 teachers', icon: GlobeAltIcon },
  { name: 'Japanese tutors', tutors: '2,902 teachers', icon: GlobeAltIcon },
  { name: 'Portuguese tutors', tutors: '1,635 teachers', icon: GlobeAltIcon },
  { name: 'Mathematics', tutors: '8,420 teachers', icon: AcademicCapIcon },
  { name: 'Programming', tutors: '6,250 teachers', icon: CodeBracketIcon },
  { name: 'Business', tutors: '4,180 teachers', icon: BriefcaseIcon },
];

function LandingPage() {
  return (
    <div className="pt-14 lg:pt-16">
      {/* Hero Section - Preply Pink */}
      <section className="bg-[#FF6B8A] relative overflow-hidden">
        <div className="container-custom relative py-12 lg:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left - Text Content */}
              <div className="text-white">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6">
                  Learn faster with your best language tutor.
                </h1>
                <Link
                  to="/tutors"
                  className="inline-flex items-center gap-2 bg-preply-black text-white px-8 py-4 rounded-xl font-semibold hover:bg-preply-dark transition-colors"
                >
                  Find your tutor
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
              </div>

              {/* Right - Images */}
              <div className="hidden lg:block relative">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&h=500&fit=crop"
                    alt="Tutor"
                    className="rounded-2xl shadow-2xl relative z-10"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=400&fit=crop"
                    alt="Student"
                    className="absolute -right-8 top-8 rounded-2xl shadow-2xl z-20"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=250&h=320&fit=crop"
                    alt="Learning"
                    className="absolute -right-16 top-32 rounded-2xl shadow-2xl z-30"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center lg:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-preply-black mb-2">
                  {stat.value}
                  {stat.icon && (
                    <span className="ml-1">
                      <StarIconSolid className="w-6 h-6 inline" />
                    </span>
                  )}
                </div>
                <div className="text-sm text-neutral-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Grid */}
      <section className="py-12 bg-white border-t border-neutral-200">
        <div className="container-custom">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <Link
                key={subject.name}
                to={`/tutors?subject=${subject.name.toLowerCase().split(' ')[0]}`}
                className="group border border-neutral-200 rounded-xl p-5 hover:border-preply-black hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <subject.icon className="w-5 h-5 text-preply-black" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-preply-black">{subject.name}</h3>
                      <p className="text-sm text-neutral-500">{subject.tutors}</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-neutral-400 group-hover:text-preply-black transition-colors" />
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <button className="text-preply-black font-semibold hover:underline flex items-center justify-center gap-2">
              <span>+</span> Show more
            </button>
          </div>
        </div>
      </section>

      {/* Progress Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-preply-black mb-4">
              Progress starts with the right tutor
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Millions of learners. Over 100,000 tutors. Progress that's personal (and proven).
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&h=700&fit=crop"
                alt="Student learning"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -left-4 top-1/4 bg-white p-6 rounded-2xl shadow-xl max-w-xs">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src="https://i.pravatar.cc/50?img=1"
                    alt="Tutor"
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-semibold">Milena</div>
                    <div className="text-sm text-neutral-500">French tutor</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <StarIconSolid className="w-4 h-4 text-preply-black" />
                    <span className="font-semibold">4.9</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-preply-black text-white p-8 lg:p-12 rounded-3xl">
                <h3 className="text-2xl lg:text-3xl font-bold mb-6">
                  96% of learners say practicing with a real person is very important to their progress.
                </h3>
                <p className="text-white/70 mb-8">From the 2025 TutorXpert Efficiency Study</p>
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-primary-500 rounded-full" />
                  <div className="w-3 h-3 bg-white/30 rounded-full" />
                  <div className="w-3 h-3 bg-white/30 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-neutral-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-preply-black mb-4">
              How TutorXpert works:
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-white border-2 border-neutral-200 rounded-3xl p-8">
              <div className="w-10 h-10 bg-[#6EE7D7] rounded-lg flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-preply-black">1</span>
              </div>
              <h3 className="text-2xl font-bold text-preply-black mb-4">Find your tutor.</h3>
              <p className="text-neutral-600 mb-6">
                We'll connect you with a tutor who motivates, challenges, and supports you — from first lesson to fluency.
              </p>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-neutral-200 rounded-xl">
                    <img
                      src={`https://i.pravatar.cc/50?img=${i + 10}`}
                      alt="Tutor"
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">French tutor</div>
                      <div className="text-xs text-neutral-500">Speaks French (Native), English (Advanced) +2</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border-2 border-neutral-200 rounded-3xl p-8">
              <div className="w-10 h-10 bg-[#FDE047] rounded-lg flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-preply-black">2</span>
              </div>
              <h3 className="text-2xl font-bold text-preply-black mb-4">Start learning.</h3>
              <p className="text-neutral-600 mb-6">
                Your tutor will tailor every lesson to your learning goals, so progress feels personal from the very beginning.
              </p>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop"
                  alt="Learning"
                  className="rounded-xl"
                />
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-preply-black rounded-xl" />
              </div>
            </div>

            <div className="bg-white border-2 border-neutral-200 rounded-3xl p-8">
              <div className="w-10 h-10 bg-[#60A5FA] rounded-lg flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-preply-black">3</span>
              </div>
              <h3 className="text-2xl font-bold text-preply-black mb-4">Make progress every week.</h3>
              <p className="text-neutral-600 mb-6">
                Choose how many lessons you want to take and build lasting confidence, one conversation at a time.
              </p>
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop"
                alt="Progress"
                className="rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16 lg:py-24 bg-[#FF6B8A]">
        <div className="container-custom text-center text-white">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Lessons you'll love. Guaranteed.
          </h2>
          <p className="text-lg text-white/80">
            Try another tutor for free if you're not satisfied.
          </p>
        </div>
      </section>

      {/* Become a Tutor */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=700&fit=crop"
                alt="Become a tutor"
                className="rounded-3xl shadow-xl w-full"
              />
            </div>

            <div className="bg-[#2DD4BF] rounded-3xl p-8 lg:p-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-preply-black mb-4">
                Become a tutor
              </h2>
              <p className="text-preply-black/70 mb-6">
                Earn money sharing your expert knowledge with students. Sign up to start tutoring online with TutorXpert.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-preply-black">
                  <CheckCircleIcon className="w-5 h-5" />
                  Find new students
                </li>
                <li className="flex items-center gap-3 text-preply-black">
                  <CheckCircleIcon className="w-5 h-5" />
                  Grow your business
                </li>
                <li className="flex items-center gap-3 text-preply-black">
                  <CheckCircleIcon className="w-5 h-5" />
                  Get paid securely
                </li>
              </ul>
              <Link
                to="/become-a-tutor"
                className="inline-flex items-center justify-center gap-2 bg-preply-black text-white px-8 py-4 rounded-xl font-semibold hover:bg-preply-dark transition-colors w-full lg:w-auto"
              >
                Become a tutor
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <p className="mt-6 text-center lg:text-left">
                <Link to="/#how-it-works" className="text-preply-black underline hover:text-primary-500">
                  How our platform works
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Training */}
      <section className="section bg-white border-t border-neutral-200">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-preply-black mb-4">
                Corporate language training for business
              </h2>
              <p className="text-neutral-600 mb-6">
                TutorXpert corporate training is designed for teams and businesses offering personalized language learning with online tutors. Book a demo to learn more about it.
              </p>
              <p className="text-neutral-600 mb-8">
                Do you want your employer to pay for your lessons?<br />
                Refer your company now!
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-[#93C5FD] text-preply-black px-6 py-3 rounded-xl font-semibold hover:bg-blue-300 transition-colors">
                  Book a demo
                </button>
                <button className="border-2 border-preply-black text-preply-black px-6 py-3 rounded-xl font-semibold hover:bg-neutral-50 transition-colors">
                  Refer your company
                </button>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=400&fit=crop"
                alt="Corporate training"
                className="rounded-2xl"
              />
              <div className="absolute -top-4 left-1/4 bg-[#FDE047] px-3 py-1 rounded text-sm font-semibold">
                Valise
              </div>
              <div className="absolute top-1/2 -right-4 bg-[#FDE047] px-3 py-1 rounded text-sm font-semibold">
                Luggage
              </div>
              <div className="absolute bottom-1/4 left-1/3 bg-[#FDE047] px-3 py-1 rounded text-sm font-semibold">
                Maleta
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-preply-black mb-6">
              Start Learning Today
            </h2>
            <p className="text-xl text-neutral-600 mb-10">
              Join thousands of learners achieving their goals with personalized tutoring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth/signup"
                className="inline-flex items-center justify-center gap-2 bg-preply-black text-white px-8 py-4 rounded-xl font-semibold hover:bg-preply-dark transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                to="/tutors"
                className="inline-flex items-center justify-center gap-2 border-2 border-preply-black text-preply-black px-8 py-4 rounded-xl font-semibold hover:bg-neutral-50 transition-colors"
              >
                Browse Tutors
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
