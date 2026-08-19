import React from 'react';

const StudentTimeline = ({ events = [] }) => {
  return (
    <div className="timeline">
      {events.map((ev) => (
        <div key={ev.id || ev.date} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-body">
            <div className="timeline-head">
              <strong>{ev.title}</strong>
              <span className="timeline-date">{ev.date}</span>
            </div>
            <div className="timeline-text">{ev.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StudentTimeline;
