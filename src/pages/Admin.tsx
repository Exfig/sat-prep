import { useState } from 'react';
import AccountsTab from '../components/admin/AccountsTab';
import QuestionDataTab from '../components/admin/QuestionDataTab';
import UsageStatsTab from '../components/admin/UsageStatsTab';
import FlaggedQuestionsTab from '../components/admin/FlaggedQuestionsTab';
import QuestionViewerTab from '../components/admin/QuestionViewerTab';
import WaitlistTab from '../components/admin/WaitlistTab';
import EmailSequencesTab from '../components/admin/EmailSequencesTab';
import ReviewsTab from '../components/admin/ReviewsTab';

const TABS = ['Accounts', 'Question Data', 'Question Viewer', 'Usage Stats', 'Flagged Questions', 'Waitlist', 'Email Sequences', 'Reviews'] as const;
type TabId = (typeof TABS)[number];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabId>('Accounts');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Panel</h1>

      {/* Tab navigation */}
      <div className="overflow-x-auto -mx-4 px-4 mb-6">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit min-w-full sm:min-w-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap min-h-[44px] ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'Accounts' && <AccountsTab />}
      {activeTab === 'Question Data' && <QuestionDataTab />}
      {activeTab === 'Question Viewer' && <QuestionViewerTab />}
      {activeTab === 'Usage Stats' && <UsageStatsTab />}
      {activeTab === 'Flagged Questions' && <FlaggedQuestionsTab />}
      {activeTab === 'Waitlist' && <WaitlistTab />}
      {activeTab === 'Email Sequences' && <EmailSequencesTab />}
      {activeTab === 'Reviews' && <ReviewsTab />}
    </div>
  );
}
