import type { SectionId, DomainId, Difficulty } from '../types';
import { SECTION_NAMES, DOMAIN_NAMES, SECTION_DOMAINS } from '../types';

interface DomainFilterProps {
  selectedSection?: SectionId;
  selectedDomain?: DomainId;
  selectedDifficulty?: Difficulty;
  onSectionChange: (section?: SectionId) => void;
  onDomainChange: (domain?: DomainId) => void;
  onDifficultyChange: (difficulty?: Difficulty) => void;
}

const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  medium: 'bg-amber-100 text-amber-700 border-amber-300',
  hard: 'bg-red-100 text-red-700 border-red-300',
};

const sectionIds = Object.keys(SECTION_NAMES) as SectionId[];

export default function DomainFilter({
  selectedSection,
  selectedDomain,
  selectedDifficulty,
  onSectionChange,
  onDomainChange,
  onDifficultyChange,
}: DomainFilterProps) {
  // Get domains filtered by selected section
  const availableDomains: DomainId[] = selectedSection
    ? SECTION_DOMAINS[selectedSection]
    : (Object.keys(DOMAIN_NAMES) as DomainId[]);

  const handleSectionChange = (section?: SectionId) => {
    onSectionChange(section);
    // Clear domain if it doesn't belong to the new section
    if (selectedDomain && section) {
      const domainsInSection = SECTION_DOMAINS[section];
      if (!domainsInSection.includes(selectedDomain)) {
        onDomainChange(undefined);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Section toggle pills */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Section</label>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Section filter">
          <button
            onClick={() => handleSectionChange(undefined)}
            role="radio"
            aria-checked={!selectedSection}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
              !selectedSection
                ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            All
          </button>
          {sectionIds.map((id) => (
            <button
              key={id}
              onClick={() => handleSectionChange(id)}
              role="radio"
              aria-checked={selectedSection === id}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                selectedSection === id
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {SECTION_NAMES[id]}
            </button>
          ))}
        </div>
      </div>

      {/* Domain dropdown */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Domain</label>
        <select
          value={selectedDomain ?? ''}
          onChange={(e) => onDomainChange(e.target.value ? (e.target.value as DomainId) : undefined)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700
            focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
        >
          <option value="">All Domains</option>
          {availableDomains.map((id) => (
            <option key={id} value={id}>{DOMAIN_NAMES[id]}</option>
          ))}
        </select>
      </div>

      {/* Difficulty selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
        <div className="flex gap-2" role="radiogroup" aria-label="Difficulty filter">
          <button
            onClick={() => onDifficultyChange(undefined)}
            role="radio"
            aria-checked={!selectedDifficulty}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
              !selectedDifficulty
                ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            All
          </button>
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => onDifficultyChange(d)}
              role="radio"
              aria-checked={selectedDifficulty === d}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                selectedDifficulty === d
                  ? difficultyColors[d]
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
