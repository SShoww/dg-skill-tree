import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import CourseCard from './CourseCard';
import { Typography, Tabs } from 'antd';
import { ScheduleOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from '../context/LanguageContext';

const { Title, Paragraph } = Typography;

const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export default function SkillTreeGrid({ 
  courses, 
  completedCourses, 
  unlockedCourses, 
  selectedCourseCode, 
  careerFocus,
  careerRecommendedCodes = [],
  getMissingPrereqs,
  onSelectCourse, 
  onToggleComplete,
  selectedGeElectives = {},
  onSelectGeElective,
  selectedMajorElectives = {},
  onSelectMajorElective,
  onAddMajorElectiveSlotClick,
  hoveredCourseCode,
  setHoveredCourseCode,
  highlightedCourseCode,
  setHighlightedCourseCode
}) {
  const { language, t } = useTranslation();
  const isTh = language === 'th';
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [connections, setConnections] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Group courses by Year and Semester for study plan
  const studyPlanCourses = courses.filter(c => c.year !== null && c.semester !== null);

  // Define semesters (8 columns)
  const semesters = [
    { year: 1, semester: 1, label: isTh ? 'ปี 1 เทอม 1' : 'Y1 Sem 1' },
    { year: 1, semester: 2, label: isTh ? 'ปี 1 เทอม 2' : 'Y1 Sem 2' },
    { year: 2, semester: 1, label: isTh ? 'ปี 2 เทอม 1' : 'Y2 Sem 1' },
    { year: 2, semester: 2, label: isTh ? 'ปี 2 เทอม 2' : 'Y2 Sem 2' },
    { year: 3, semester: 1, label: isTh ? 'ปี 3 เทอม 1' : 'Y3 Sem 1' },
    { year: 3, semester: 2, label: isTh ? 'ปี 3 เทอม 2' : 'Y3 Sem 2' },
    { year: 4, semester: 1, label: isTh ? 'ปี 4 เทอม 1' : 'Y4 Sem 1' },
    { year: 4, semester: 2, label: isTh ? 'ปี 4 เทอม 2' : 'Y4 Sem 2' }
  ];

  // Helper to recursively find predecessors (prerequisites)
  const getPredecessors = useCallback((code, visited = new Set()) => {
    if (!code || visited.has(code)) return [];
    visited.add(code);
    const course = courses.find(c => c.code === code);
    if (!course || !course.prereqs) return [];
    
    let result = [...course.prereqs];
    
    const recurse = (cCode) => {
      const c = courses.find(item => item.code === cCode);
      if (!c || !c.prereqs) return [];
      let subResult = [...c.prereqs];
      c.prereqs.forEach(pre => {
        if (!visited.has(pre)) {
          visited.add(pre);
          subResult = [...subResult, ...recurse(pre)];
        }
      });
      return subResult;
    };

    course.prereqs.forEach(pre => {
      result = [...result, ...recurse(pre)];
    });
    return Array.from(new Set(result));
  }, [courses]);

  // Helper to recursively find successors (courses unlocked by this course)
  const getSuccessors = useCallback((code, visited = new Set()) => {
    if (!code || visited.has(code)) return [];
    visited.add(code);
    
    const recurse = (cCode) => {
      const posts = courses.filter(c => c.prereqs && c.prereqs.includes(cCode));
      let subResult = posts.map(c => c.code);
      posts.forEach(post => {
        if (!visited.has(post.code)) {
          visited.add(post.code);
          subResult = [...subResult, ...recurse(post.code)];
        }
      });
      return subResult;
    };

    const posts = courses.filter(c => c.prereqs && c.prereqs.includes(code));
    let result = posts.map(c => c.code);
    posts.forEach(post => {
      result = [...result, ...recurse(post.code)];
    });
    return Array.from(new Set(result));
  }, [courses]);

  const activeFocusCode = hoveredCourseCode || highlightedCourseCode || selectedCourseCode;
  
  // Memoized chains of focus
  const activePredecessors = useMemo(() => activeFocusCode ? getPredecessors(activeFocusCode) : [], [activeFocusCode, getPredecessors]);
  const activeSuccessors = useMemo(() => activeFocusCode ? getSuccessors(activeFocusCode) : [], [activeFocusCode, getSuccessors]);
  const activeChain = useMemo(() => activeFocusCode ? [activeFocusCode, ...activePredecessors, ...activeSuccessors] : [], [activeFocusCode, activePredecessors, activeSuccessors]);

  // Update lines positions for the SVG overlay
  const updateConnectionLines = useCallback(() => {
    if (!containerRef.current || !svgRef.current || !activeFocusCode) {
      setConnections(prev => prev.length === 0 ? prev : []);
      return;
    }

    const svgRect = svgRef.current.getBoundingClientRect();
    const newConnections = [];

    // Loop through all courses in the active chain and connect them if they are prerequisites
    courses.forEach(course => {
      if (!activeChain.includes(course.code)) return;

      course.prereqs.forEach(preCode => {
        if (!activeChain.includes(preCode)) return;

        const preEl = document.getElementById(`course-card-${preCode}`);
        const selEl = document.getElementById(`course-card-${course.code}`);
        
        if (preEl && selEl) {
          const preRect = preEl.getBoundingClientRect();
          const selRect = selEl.getBoundingClientRect();
          
          const x1 = preRect.right - svgRect.left;
          const y1 = preRect.top + preRect.height / 2 - svgRect.top;
          const x2 = selRect.left - svgRect.left - 10; // Offset slightly for arrowhead
          const y2 = selRect.top + selRect.height / 2 - svgRect.top;
          
          const isSameLevel = Math.abs(y2 - y1) < 10;

          // Check if immediately adjacent semester columns
          const preCourseObj = courses.find(c => c.code === preCode);
          const targetCourseObj = course;
          
          const preColIdx = preCourseObj && preCourseObj.year !== null && preCourseObj.semester !== null
            ? (preCourseObj.year - 1) * 2 + (preCourseObj.semester - 1)
            : -999;
          const targetColIdx = targetCourseObj && targetCourseObj.year !== null && targetCourseObj.semester !== null
            ? (targetCourseObj.year - 1) * 2 + (targetCourseObj.semester - 1)
            : -999;
          
          const isAdjacentColumn = targetColIdx === preColIdx + 1;
          const isAdjacentSameRow = isSameLevel && isAdjacentColumn;

          // Determine connection type:
          // If the course is a successor of the active focus, or the prereq is the active focus itself, it's an unlock path (Green).
          // Otherwise, it's part of the prerequisite ancestry path (Red).
          let type = 'prereq';
          if (activeSuccessors.includes(course.code) || preCode === activeFocusCode) {
            type = 'unlock';
          }

          newConnections.push({
            id: `line-sem-${preCode}-${course.code}`,
            x1, y1, x2, y2,
            type,
            isSameLevel,
            isAdjacentSameRow,
            title: type === 'prereq' ? `Requires: ${preCode}` : `Unlocks: ${course.dept_code}`
          });
        }
      });
    });

    // Prevent rendering loop by comparing content before setting state
    setConnections(prev => {
      if (prev.length === newConnections.length && 
          prev.every((conn, i) => 
            conn.x1 === newConnections[i].x1 && 
            conn.y1 === newConnections[i].y1 && 
            conn.x2 === newConnections[i].x2 && 
            conn.y2 === newConnections[i].y2 &&
            conn.type === newConnections[i].type &&
            conn.isSameLevel === newConnections[i].isSameLevel &&
            conn.isAdjacentSameRow === newConnections[i].isAdjacentSameRow
          )
      ) {
        return prev;
      }
      return newConnections;
    });
  }, [courses, activeFocusCode, activeChain, activeSuccessors]);

  useEffect(() => {
    const rId = requestAnimationFrame(() => {
      updateConnectionLines();
    });
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      updateConnectionLines();
    };

    const handleScroll = () => {
      updateConnectionLines();
    };

    window.addEventListener('resize', handleResize);
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, true);
    }

    const timer = setTimeout(updateConnectionLines, 120);

    return () => {
      cancelAnimationFrame(rId);
      window.removeEventListener('resize', handleResize);
      if (container) {
        container.removeEventListener('scroll', handleScroll, true);
      }
      clearTimeout(timer);
    };
  }, [updateConnectionLines, completedCourses, unlockedCourses, windowWidth, activeFocusCode]);

  const getCurvePath = (x1, y1, x2, y2, isAdjacentSameRow = false) => {
    if (isAdjacentSameRow) {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    const xMid = (x1 + x2) / 2;
    const dy = y2 - y1;
    
    if (Math.abs(dy) < 10) {
      // Same-Level Bridge Arch Routing
      const L_stub = 20; // 20px straight horizontal out/in stubs
      const h_arc = 35;  // 35px height lift for the arch
      
      const x1_stub = x1 + L_stub;
      const x2_stub = x2 - L_stub;

      // First cubic curve control points
      const cp1x = x1_stub + (xMid - x1_stub) / 2;
      const cp1y = y1;
      const cp2x = xMid - (xMid - x1_stub) / 2;
      const cp2y = y1 - h_arc;

      // Second cubic curve control points
      const cp3x = xMid + (x2_stub - xMid) / 2;
      const cp3y = y2 - h_arc;
      const cp4x = x2_stub - (x2_stub - xMid) / 2;
      const cp4y = y2;

      return `M ${x1} ${y1} ` +
             `L ${x1_stub} ${y1} ` +
             `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${xMid} ${y1 - h_arc} ` +
             `C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${x2_stub} ${y2} ` +
             `L ${x2} ${y2}`;
    }
    
    const dirY = dy > 0 ? 1 : -1;
    const dirX = x2 > x1 ? 1 : -1;
    
    const R = 24; // Generous corner radius for smooth step routing
    const r = Math.min(R, Math.abs(xMid - x1), Math.abs(dy) / 2);
    
    if (r <= 2) {
      return `M ${x1} ${y1} L ${xMid} ${y1} L ${xMid} ${y2} L ${x2} ${y2}`;
    }
    
    const p1_x = xMid - r * dirX;
    const p1_y = y1;
    
    const p2_x = xMid;
    const p2_y = y1 + r * dirY;
    
    const p3_x = xMid;
    const p3_y = y2 - r * dirY;
    
    const p4_x = xMid + r * dirX;
    const p4_y = y2;
    
    return `M ${x1} ${y1} ` +
           `L ${p1_x} ${p1_y} ` +
           `Q ${xMid} ${y1} ${p2_x} ${p2_y} ` +
           `L ${p3_x} ${p3_y} ` +
           `Q ${xMid} ${y2} ${p4_x} ${p4_y} ` +
           `L ${x2} ${y2}`;
  };

  const handleContainerClick = (e) => {
    if (!e.target.closest('.course-card-wrapper') && 
        !e.target.closest('.ant-tabs-nav') && 
        !e.target.closest('button')) {
      setHighlightedCourseCode(null);
      setHoveredCourseCode(null);
    }
  };

  return (
    <div className="space-y-8" onClick={handleContainerClick}>
      {/* Semester Grid Timeline */}
      <div className="bg-transparent border-0 shadow-none p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#1e293b' }} className="flex items-center gap-2">
              <ScheduleOutlined style={{ color: '#4f46e5' }} />
              Semester Study Plan Timeline
            </Title>
            <Paragraph style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Standard curriculum structure mapped semester-by-semester. Click or hover any course to inspect requirements.
            </Paragraph>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1 bg-red-500 rounded inline-block"></span>
              <span>Prerequisites (วิชาบังคับก่อน)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1 bg-emerald-500 rounded inline-block"></span>
              <span>Unlocks (วิชาที่ถูกปลดล็อค)</span>
            </div>
          </div>
        </div>

        {/* Responsive Semester View */}
        {windowWidth < 768 ? (
          <Tabs
            tabBarGutter={8}
            defaultActiveKey="0"
            type="card"
            centered
            className="mobile-semester-tabs"
            items={semesters.map((sem, idx) => {
              const semCourses = studyPlanCourses.filter(
                c => c.year === sem.year && c.semester === sem.semester
              );

              // Check if this semester has any active/prereq/unlock courses
              const hasActive = semCourses.some(c => c.code === activeFocusCode);
              const hasPrereq = semCourses.some(c => activePredecessors.includes(c.code));
              const hasUnlock = semCourses.some(c => activeSuccessors.includes(c.code));

              // Tab header label with indicators
              const tabLabel = (
                <span className="flex items-center gap-1 text-[11px] font-extrabold select-none">
                  {sem.label.replace('Sem ', 'S').replace('เทอม ', 'ท')}
                  {activeFocusCode && (
                    <span className="flex gap-0.5">
                      {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="Active Focus" />}
                      {hasPrereq && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Prerequisite" />}
                      {hasUnlock && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Unlock" />}
                    </span>
                  )}
                </span>
              );

              return {
                label: tabLabel,
                key: String(idx),
                children: (
                  <div className="space-y-4 pt-2">
                    {/* Header in pane */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-center select-none">
                      <span className="font-extrabold text-[10px] text-slate-400 block uppercase tracking-wider">
                        {t('year')} {sem.year}
                      </span>
                      <span className="font-black text-sm text-slate-700">
                        {t('semester')} {sem.semester}
                      </span>
                    </div>

                    {/* Course Cards List */}
                    <div className="space-y-3 w-full">
                      {semCourses.map(course => {
                        const isCompleted = completedCourses.includes(course.code);
                        const isUnlocked = unlockedCourses.includes(course.code);
                        const isSelected = selectedCourseCode === course.code;
                        const isCareerRecommended = careerRecommendedCodes.includes(course.code);
                        const { missing = [], isOr = false } = getMissingPrereqs ? getMissingPrereqs(course.code) : {};

                        const isMajorElectiveSlot = course.category === 'Major_Elective' && course.code.startsWith('MJ-EL-');
                        const assignedCourseCode = isMajorElectiveSlot ? selectedMajorElectives[course.code] : null;

                        let highlightType = null;
                        if (isSelected) {
                          highlightType = 'selected';
                        } else if (activeFocusCode === course.code) {
                          highlightType = 'selected';
                        } else if (activePredecessors.includes(course.code)) {
                          highlightType = 'prereq';
                        } else if (activeSuccessors.includes(course.code)) {
                          highlightType = 'unlock';
                        }

                        let isDimmed = false;
                        if (activeFocusCode) {
                          isDimmed = !activeChain.includes(course.code);
                        } else if (careerFocus) {
                          isDimmed = !isCareerRecommended;
                        }

                        if (isMajorElectiveSlot && !assignedCourseCode) {
                          return (
                            <div 
                              key={course.code} 
                              onClick={() => onAddMajorElectiveSlotClick && onAddMajorElectiveSlotClick(course.code)}
                              className="border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50 rounded-xl p-3 flex flex-col justify-center items-center cursor-pointer transition-all duration-200"
                              style={{ height: '120px', userSelect: 'none' }}
                            >
                              <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <PlusOutlined style={{ fontSize: '11px' }} /> {isTh ? 'วิชาเอกเลือก' : 'Major Elective'}
                              </span>
                              <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {isTh ? 'คลิกเพื่อเลือกวิชา' : 'Click to Add Slot'}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div key={course.code}>
                            <CourseCard
                              course={course}
                              isCompleted={isCompleted}
                              isUnlocked={isUnlocked}
                              isSelected={isSelected}
                              isCareerRecommended={isCareerRecommended}
                              hasActiveCareerFocus={!!careerFocus}
                              missingPrereqs={missing}
                              isOrPrereq={isOr}
                              onClick={() => {
                                if (highlightedCourseCode === course.code) {
                                  setHighlightedCourseCode(null);
                                } else {
                                  setHighlightedCourseCode(course.code);
                                }
                              }}
                              onDoubleClick={() => onSelectCourse(course.code)}
                              onOpenDetails={() => onSelectCourse(course.code)}
                              onToggleComplete={onToggleComplete}
                              selectedGeElectives={selectedGeElectives}
                              onSelectGeElective={onSelectGeElective}
                              selectedMajorElectives={selectedMajorElectives}
                              onSelectMajorElective={onSelectMajorElective}
                              onHoverStart={(code) => { if (!isTouchDevice) setHoveredCourseCode(code); }}
                              onHoverEnd={() => { if (!isTouchDevice) setHoveredCourseCode(null); }}
                              highlightType={highlightType}
                              isDimmed={isDimmed}
                              isTimeline={true}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              };
            })}
          />
        ) : (
          <div 
            ref={containerRef}
            className="relative overflow-x-auto pb-12 scroll-smooth timeline-scroll-container"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="relative" style={{ minWidth: '1880px', width: '100%' }}>
              {/* SVG Overlay */}
              <svg 
                ref={svgRef}
                className="absolute pointer-events-none"
                style={{ 
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 999,
                  minWidth: '1880px',
                  overflow: 'visible'
                }}
              >
                <defs>
                  <filter id="glow-red-s" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-green-s" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  
                  {/* Arrowhead Markers */}
                  <marker id="arrow-red-s" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L6,3 Z" fill="#ef4444" />
                  </marker>
                  <marker id="arrow-green-s" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L6,3 Z" fill="#10b981" />
                  </marker>
                </defs>
                
                {connections.map(line => (
                  <path
                    key={line.id}
                    d={getCurvePath(line.x1, line.y1, line.x2, line.y2, line.isAdjacentSameRow)}
                    fill="none"
                    stroke={line.type === 'prereq' ? '#ef4444' : '#10b981'}
                    strokeWidth={line.isAdjacentSameRow ? 2 : 3.5}
                    filter={line.type === 'prereq' ? 'url(#glow-red-s)' : 'url(#glow-green-s)'}
                    markerEnd={line.type === 'prereq' ? 'url(#arrow-red-s)' : 'url(#arrow-green-s)'}
                    className="transition-all duration-300 stroke-dash"
                    style={line.isSameLevel ? { strokeDasharray: '6, 4' } : undefined}
                    title={line.title}
                  />
                ))}
              </svg>

              {/* 8 Columns Grid */}
              <div 
                className="grid grid-cols-8 gap-8 relative z-10 pr-12"
                style={{ minWidth: '1880px' }}
              >
              {semesters.map((sem, idx) => {
                const semCourses = studyPlanCourses.filter(
                  c => c.year === sem.year && c.semester === sem.semester
                );

                return (
                  <div key={idx} className="space-y-4 semester-column-container">
                    {/* Semester Header */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-center shadow-[0_2px_4px_rgba(0,0,0,0.01)] select-none">
                      <span className="font-extrabold text-[10px] text-slate-400 block uppercase tracking-wider">
                        {t('year')} {sem.year}
                      </span>
                      <span className="font-black text-sm text-slate-700">
                        {t('semester')} {sem.semester}
                      </span>
                    </div>

                    {/* Course Cards List */}
                    <div className="semester-col-scrollable space-y-3 pr-1">
                      {semCourses.map(course => {
                        const isCompleted = completedCourses.includes(course.code);
                        const isUnlocked = unlockedCourses.includes(course.code);
                        const isSelected = selectedCourseCode === course.code;
                        const isCareerRecommended = careerRecommendedCodes.includes(course.code);
                        const { missing = [], isOr = false } = getMissingPrereqs ? getMissingPrereqs(course.code) : {};

                        // Check if this is a Major Elective slot and if it's assigned
                        const isMajorElectiveSlot = course.category === 'Major_Elective' && course.code.startsWith('MJ-EL-');
                        const assignedCourseCode = isMajorElectiveSlot ? selectedMajorElectives[course.code] : null;

                        // Determine path highlighting state
                        let highlightType = null;
                        if (isSelected) {
                          highlightType = 'selected';
                        } else if (activeFocusCode === course.code) {
                          highlightType = 'selected';
                        } else if (activePredecessors.includes(course.code)) {
                          highlightType = 'prereq';
                        } else if (activeSuccessors.includes(course.code)) {
                          highlightType = 'unlock';
                        }

                        // Determine if card should dim
                        let isDimmed = false;
                        if (activeFocusCode) {
                          isDimmed = !activeChain.includes(course.code);
                        } else if (careerFocus) {
                          isDimmed = !isCareerRecommended;
                        }

                        if (isMajorElectiveSlot && !assignedCourseCode) {
                          // Render interactive dashed slot card
                          return (
                            <div 
                              key={course.code} 
                              id={`course-card-${course.code}`}
                              onClick={() => onAddMajorElectiveSlotClick && onAddMajorElectiveSlotClick(course.code)}
                              className="border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50 rounded-xl p-3 flex flex-col justify-center items-center cursor-pointer transition-all duration-200"
                              style={{ height: '120px', width: '200px', userSelect: 'none' }}
                            >
                              <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <PlusOutlined style={{ fontSize: '11px' }} /> {isTh ? 'วิชาเอกเลือก' : 'Major Elective'}
                              </span>
                              <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {isTh ? 'คลิกเพื่อเลือกวิชา' : 'Click to Add Slot'}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div key={course.code} id={`course-card-${course.code}`}>
                            <CourseCard
                              course={course}
                              isCompleted={isCompleted}
                              isUnlocked={isUnlocked}
                              isSelected={isSelected}
                              isCareerRecommended={isCareerRecommended}
                              hasActiveCareerFocus={!!careerFocus}
                              missingPrereqs={missing}
                              isOrPrereq={isOr}
                               onClick={() => {
                                 if (highlightedCourseCode === course.code) {
                                   setHighlightedCourseCode(null);
                                 } else {
                                   setHighlightedCourseCode(course.code);
                                 }
                               }}
                               onDoubleClick={() => onSelectCourse(course.code)}
                               onOpenDetails={() => onSelectCourse(course.code)}
                               onToggleComplete={onToggleComplete}
                               selectedGeElectives={selectedGeElectives}
                               onSelectGeElective={onSelectGeElective}
                               selectedMajorElectives={selectedMajorElectives}
                               onSelectMajorElective={onSelectMajorElective}
                               onHoverStart={(code) => { if (!isTouchDevice) setHoveredCourseCode(code); }}
                               onHoverEnd={() => { if (!isTouchDevice) setHoveredCourseCode(null); }}
                               highlightType={highlightType}
                               isDimmed={isDimmed}
                               isTimeline={true}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
