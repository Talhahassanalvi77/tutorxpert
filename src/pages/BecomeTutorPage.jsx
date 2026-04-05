import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const benefits = [
  {
    icon: CurrencyDollarIcon,
    title: 'Earn Competitive Income',
    description: 'Set your own rates and keep up to 80% of your earnings.',
  },
  {
    icon: ClockIcon,
    title: 'Flexible Schedule',
    description: 'Teach when you want. You control your availability.',
  },
  {
    icon: UserGroupIcon,
    title: 'Global Students',
    description: 'Connect with learners from around the world.',
  },
  {
    icon: AcademicCapIcon,
    title: 'Professional Growth',
    description: 'Develop your teaching skills and build your reputation.',
  },
];

const requirements = [
  'Expertise in one or more subjects',
  'Strong communication skills',
  'Reliable internet connection',
  'Webcam and microphone',
  'Passion for helping others learn',
];

function BecomeTutorPage() {
  return (
    <div className="pt-20 lg:pt-24 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-primary py-16 lg:py-24">
        <div className="container-custom text-center text-white">
          <h1 className="text-4xl lg:text-5xl font-bold font-display mb-6">
            Become a TutorXpert Tutor
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Share your knowledge, inspire students, and earn money on your own schedule.
          </p>
          <Link to="/auth/signup" className="btn-lg bg-white text-primary-600 hover:bg-neutral-100">
            Start Teaching Today
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-display text-neutral-900 mb-4">
              Why Teach on TutorXpert?
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Join thousands of tutors building successful teaching careers
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <benefit.icon className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">{benefit.title}</h3>
                <p className="text-neutral-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section id="requirements" className="section bg-neutral-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold font-display text-neutral-900 mb-6">
                Requirements to Become a Tutor
              </h2>
              <p className="text-lg text-neutral-600 mb-8">
                We're looking for passionate educators who want to make a difference in students' lives.
              </p>
              <ul className="space-y-4">
                {requirements.map((req) => (
                  <li key={req} className="flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-success-500 flex-shrink-0" />
                    <span className="text-neutral-700">{req}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth/signup" className="btn-primary mt-8 inline-flex items-center gap-2">
                Apply Now <ArrowRightIcon className="w-5 h-5" />
              </Link>
            </div>
            <div className="card p-8">
              <h3 className="text-xl font-semibold text-neutral-900 mb-6">How to Get Started</h3>
              <div className="space-y-6">
                {[
                  { step: '1', title: 'Create an Account', desc: 'Sign up and select "I want to teach"' },
                  { step: '2', title: 'Complete Your Profile', desc: 'Add your expertise, experience, and availability' },
                  { step: '3', title: 'Get Verified', desc: 'Our team will review your application' },
                  { step: '4', title: 'Start Teaching', desc: 'Accept bookings and help students learn' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-10 h-10 bg-primary-500 text-white rounded-xl flex items-center justify-center flex-shrink-0 font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900">{item.title}</h4>
                      <p className="text-sm text-neutral-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="bg-gradient-primary rounded-3xl p-8 lg:p-16 text-center text-white">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-6">
              Ready to Start Teaching?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
              Join TutorXpert today and start making a difference in students' lives while earning on your terms.
            </p>
            <Link to="/auth/signup" className="btn-lg bg-white text-primary-600 hover:bg-neutral-100">
              Become a Tutor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BecomeTutorPage;
