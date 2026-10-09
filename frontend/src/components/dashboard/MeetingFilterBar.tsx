import React from 'react';
import { Search, Plus, LayoutGrid, LayoutList } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import styles from './MeetingFilterBar.module.css';

export interface MeetingFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedParticipant: string;
  onParticipantChange: (p: string) => void;
  selectedDateRange: string;
  onDateRangeChange: (dateRange: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onNewMeetingClick: () => void;
  participantsList: string[];
}

export const MeetingFilterBar: React.FC<MeetingFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedParticipant,
  onParticipantChange,
  selectedDateRange,
  onDateRangeChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onNewMeetingClick,
  participantsList,
}) => {
  const participantOptions = [
    { value: '', label: 'All Participants' },
    ...participantsList.map((p) => ({ value: p, label: p })),
  ];

  const dateRangeOptions = [
    { value: '', label: 'All Dates' },
    { value: '7days', label: 'Past 7 Days' },
    { value: '30days', label: 'Past 30 Days' },
    { value: 'older', label: 'Older than 30 Days' },
  ];

  const sortOptions = [
    { value: 'date_desc', label: 'Newest First' },
    { value: 'date_asc', label: 'Oldest First' },
    { value: 'duration_desc', label: 'Longest Duration' },
    { value: 'duration_asc', label: 'Shortest Duration' },
  ];

 
return (
  <div className={styles.filterBar}>
    <div className={styles.leftControls}>
      <div className={styles.searchWrapper}>
        <Input
          id="meeting-search"
          name="meetingSearch"
          icon={<Search size={16} />}
          placeholder="Search meetings by title or participant..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Select
        options={participantOptions}
          value={selectedParticipant}
          onChange={(e) => onParticipantChange(e.target.value)}
        />

        <Select
          options={dateRangeOptions}
          value={selectedDateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
        />
      </div>

      <div className={styles.rightControls}>
        <Select
          options={sortOptions}
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        />

        {/* View Switcher: [ Grid ] [ List ] */}
        <div className={styles.viewToggle} role="group" aria-label="View Layout Toggle">
          <button
            type="button"
            className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.activeToggle : ''}`}
            onClick={() => onViewModeChange('grid')}
            onMouseLeave={(e) => e.currentTarget.blur()}
            title="Grid View"
            aria-label="Grid View"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.activeToggle : ''}`}
            onClick={() => onViewModeChange('list')}
            onMouseLeave={(e) => e.currentTarget.blur()}
            title="List View"
            aria-label="List View"
          >
            <LayoutList size={15} />
          </button>
        </div>

        <Button variant="primary" onClick={onNewMeetingClick}>
          <Plus size={16} />
          <span>New Meeting</span>
        </Button>
      </div>
    </div>
  );
};
