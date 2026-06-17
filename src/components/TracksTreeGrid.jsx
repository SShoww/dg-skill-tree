import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import CourseCard from './CourseCard';
import { Typography, Space, Button } from 'antd';
import { useTranslation } from '../context/LanguageContext';
import { 
  CompassOutlined, 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  FullscreenOutlined,
  BlockOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  MarkerType,
  Position,
  Handle
} from '@xyflow/react';
import { coursesData } from '../data/courses';
import '@xyflow/react/dist/style.css';

const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const { Title, Paragraph } = Typography;

// Semesters list (8 columns)
const semesters = [
  { year: 1, semester: 1, label: 'Y1 Sem 1' },
  { year: 1, semester: 2, label: 'Y1 Sem 2' },
  { year: 2, semester: 1, label: 'Y2 Sem 1' },
  { year: 2, semester: 2, label: 'Y2 Sem 2' },
  { year: 3, semester: 1, label: 'Y3 Sem 1' },
  { year: 3, semester: 2, label: 'Y3 Sem 2' },
  { year: 4, semester: 1, label: 'Y4 Sem 1' },
  { year: 4, semester: 2, label: 'Y4 Sem 2' }
];

// Raw tracks configurations
const displayTracks = [
  { 
    key: 'Core_All', 
    label: 'Core Subjects', 
    filterKeys: ['Core'],
    bgColor: 'rgba(245, 158, 11, 0.015)', 
    borderColor: '#fde047',
    labelBg: '#d97706',
    labelColor: '#ffffff'
  },
  { 
    key: 'Programmer_Path', 
    label: 'Programmer Track', 
    filterKeys: ['Programmer', 'Dev'],
    bgColor: 'rgba(59, 130, 246, 0.015)', 
    borderColor: '#93c5fd',
    labelBg: '#2563eb',
    labelColor: '#ffffff'
  },
  { 
    key: 'Artist_Path', 
    label: 'Artist Track', 
    filterKeys: ['Artist'],
    bgColor: 'rgba(16, 185, 129, 0.015)', 
    borderColor: '#6ee7b7',
    labelBg: '#059669',
    labelColor: '#ffffff'
  },
  { 
    key: 'Designer_Path', 
    label: 'Designer Track', 
    filterKeys: ['Design'],
    bgColor: 'rgba(249, 115, 22, 0.015)', 
    borderColor: '#fdba74',
    labelBg: '#ea580c',
    labelColor: '#ffffff'
  },
  { 
    key: 'Misc_Path', 
    label: 'Misc (GE & Sound)', 
    filterKeys: ['Sounder', 'ETC', null],
    bgColor: 'rgba(148, 163, 184, 0.015)', 
    borderColor: '#cbd5e1',
    labelBg: '#475569',
    labelColor: '#ffffff'
  }
];

const ELECTIVE_SEMESTER_MAP = {
  // Designer Track (Design)
  "958421": { year: 3, semester: 1 }, // Sem 5 (Advanced Game Design)
  "958203": { year: 3, semester: 1 }, // Sem 5 (Game Level Design)
  "958373": { year: 3, semester: 2 }, // Sem 6 (Gamification)
  "958372": { year: 3, semester: 2 }, // Sem 6 (Serious Games Design and Applications)

  // Programmer / Dev Track (Programmer & Dev)
  "958371": { year: 3, semester: 1 }, // Sem 5 (Interactive Applications)
  "958481": { year: 3, semester: 1 }, // Sem 5 (Selected Topics in Game Development 1)
  "958341": { year: 3, semester: 1 }, // Sem 5 (Realistic Game Development)
  "958332": { year: 3, semester: 1 }, // Sem 5 (Mobile Game Development)
  "958482": { year: 3, semester: 2 }, // Sem 6 (Selected Topics in Game Development 2)
  "958333": { year: 3, semester: 2 }, // Sem 6 (Multiplayer Online Game Development)

  // Artist Track (Artist)
  "958263": { year: 3, semester: 1 }, // Sem 5 (Three-Dimensional Modelling for Game Development 2)
  "958361": { year: 3, semester: 1 }, // Sem 5 (Advanced Modelling for Game)

  // Sounder Track (Sounder - goes to Misc row)
  "958362": { year: 3, semester: 1 }, // Sem 5 (Audio and Music for Game Development)

  // ETC / Misc Track (ETC - goes to Misc row)
  "958451": { year: 3, semester: 1 }, // Sem 5 (Electronics Sports 1)
  "958204": { year: 3, semester: 1 }, // Sem 5 (Retro Game)
  "958345": { year: 3, semester: 1 }, // Sem 5 (Virtual Reality and Mixed Reality)
  "958342": { year: 3, semester: 1 }, // Sem 5 (Exergame)
  "958452": { year: 3, semester: 2 }, // Sem 6 (Electronics Sports 2)
  "958376": { year: 3, semester: 2 }, // Sem 6 (Digital Game Based Learning)
  "958441": { year: 3, semester: 2 }  // Sem 6 (Motion Capture for Game Development)
};

/* Custom React Flow Node Components */

// Custom Course Node Wrapper that hosts CourseCard and Left/Right handles
const CourseNode = ({ data }) => {
  const { language, t } = useTranslation();
  const isTh = language === 'th';

  if (data.isSlotPlaceholder) {
    const opacityClass = data.isDimmed ? 'opacity-20 grayscale-[30%] blur-[0.3px]' : 'opacity-100';
    return (
      <div style={{ position: 'relative', width: 230 }} className={opacityClass}>
        <div 
          onClick={data.onAddMajorElectiveSlotClick}
          className="border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50 rounded-xl p-2 flex flex-col justify-center items-center cursor-pointer transition-all duration-200 w-full"
          style={{ height: '82px', userSelect: 'none', backgroundColor: '#fefefe' }}
        >
          <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <PlusOutlined style={{ fontSize: '11px' }} /> {isTh ? 'วิชาเอกเลือก' : 'Major Elective'}
          </span>
          <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isTh ? 'คลิกเพื่อเลือกวิชา' : 'Add Slot'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: 230 }}>
      <Handle 
        type="target" 
        position={Position.Left} 
        id="target-left"
        style={{ background: '#94a3b8', width: 8, height: 8, border: '2px solid #ffffff', left: -4 }} 
      />
      
      <CourseCard
        course={data.course}
        isCompleted={data.isCompleted}
        isUnlocked={data.isUnlocked}
        isSelected={data.isSelected}
        isCareerRecommended={data.isCareerRecommended}
        hasActiveCareerFocus={data.hasActiveCareerFocus}
        missingPrereqs={data.missingPrereqs}
        isOrPrereq={data.isOrPrereq}
        onClick={data.onClick}
        onToggleComplete={data.onToggleComplete}
        selectedGeElectives={data.selectedGeElectives}
        onSelectGeElective={data.onSelectGeElective}
        selectedMajorElectives={data.selectedMajorElectives}
        onSelectMajorElective={data.onSelectMajorElective}
        onHoverStart={data.onHoverStart}
        onHoverEnd={data.onHoverEnd}
        highlightType={data.highlightType}
        isDimmed={data.isDimmed}
      />
      
      <Handle 
        type="source" 
        position={Position.Right} 
        id="source-right"
        style={{ background: '#94a3b8', width: 8, height: 8, border: '2px solid #ffffff', right: -4 }} 
      />
    </div>
  );
};

// Custom visual background Swimlane node that draws vertical dashed borders for semesters
const SwimlaneNode = ({ data }) => {
  const columnWidth = data.columnWidth || 320;
  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: data.bgColor || 'rgba(0,0,0,0.01)',
        borderTop: `1px solid ${data.borderColor || '#f1f5f9'}`,
        borderBottom: `1px solid ${data.borderColor || '#f1f5f9'}`,
        position: 'relative',
        pointerEvents: 'none',
        borderRadius: '12px'
      }}
    >
      {/* Draw vertical semester columns inside the swimlane */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div 
          key={i}
          style={{
            position: 'absolute',
            left: i * columnWidth,
            top: 0,
            bottom: 0,
            width: columnWidth,
            borderRight: i < 7 ? '1px dashed rgba(226, 232, 240, 0.5)' : 'none',
            pointerEvents: 'none'
          }}
        />
      ))}
    </div>
  );
};

// Custom Semester column header node
const SemesterHeaderNode = ({ data }) => {
  const { t } = useTranslation();
  return (
    <div 
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '6px 12px',
        textAlign: 'center',
        width: '100%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        userSelect: 'none'
      }}
    >
      <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        {t('year')} {data.year}
      </div>
      <div style={{ fontSize: '12px', fontWeight: 900, color: '#334155', marginTop: '1px' }}>
        {t('semester')} {data.semester}
      </div>
    </div>
  );
};

// Custom Track Label node on the left sidebar
const TrackLabelNode = ({ data }) => {
  const { t } = useTranslation();
  
  const getTrackTranslationKey = (key) => {
    switch(key) {
      case 'Core_All': return 'track_core';
      case 'Programmer_Path': return 'track_programmer';
      case 'Artist_Path': return 'track_artist';
      case 'Designer_Path': return 'track_designer';
      case 'Misc_Path': return 'track_misc';
      default: return 'track_core';
    }
  };

  return (
    <div 
      style={{
        backgroundColor: data.labelBg || '#475569',
        color: data.labelColor || '#ffffff',
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: 800,
        textAlign: 'center',
        width: '100%',
        boxShadow: '0 4px 6px rgba(0,0,0,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '42px'
      }}
    >
      {t(getTrackTranslationKey(data.trackKey)) || data.label}
    </div>
  );
};

const nodeTypes = {
  course: CourseNode,
  swimlane: SwimlaneNode,
  semesterHeader: SemesterHeaderNode,
  trackLabel: TrackLabelNode
};

export default function TracksTreeGrid({
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
  const reactFlowRef = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePaneClick = useCallback(() => {
    setHighlightedCourseCode(null);
    setHoveredCourseCode(null);
  }, [setHighlightedCourseCode, setHoveredCourseCode]);

  // Resize listener to center flowchart
  useEffect(() => {
    if (!reactFlowInstance) return;

    // Center initially
    reactFlowInstance.fitView({ padding: 0.2, duration: 400 });

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [reactFlowInstance]);

  // Helper to recursively find predecessors (prerequisites)
  const getPredecessors = useCallback((code, visited = new Set()) => {
    if (!code || visited.has(code)) return [];
    visited.add(code);
    const course = coursesData.find(c => c.code === code);
    if (!course || !course.prereqs) return [];
    
    let result = [...course.prereqs];
    
    const recurse = (cCode) => {
      const c = coursesData.find(item => item.code === cCode);
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
  }, []);

  // Helper to recursively find successors (courses unlocked by this course)
  const getSuccessors = useCallback((code, visited = new Set()) => {
    if (!code || visited.has(code)) return [];
    visited.add(code);
    
    const recurse = (cCode) => {
      const posts = coursesData.filter(c => c.prereqs && c.prereqs.includes(cCode));
      let subResult = posts.map(c => c.code);
      posts.forEach(post => {
        if (!visited.has(post.code)) {
          visited.add(post.code);
          subResult = [...subResult, ...recurse(post.code)];
        }
      });
      return subResult;
    };

    const posts = coursesData.filter(c => c.prereqs && c.prereqs.includes(code));
    let result = posts.map(c => c.code);
    posts.forEach(post => {
      result = [...result, ...recurse(post.code)];
    });
    return Array.from(new Set(result));
  }, []);

  const activeFocusCode = hoveredCourseCode || highlightedCourseCode || selectedCourseCode;
  
  // Memoized chains of focus
  const activePredecessors = useMemo(() => activeFocusCode ? getPredecessors(activeFocusCode) : [], [activeFocusCode, getPredecessors]);
  const activeSuccessors = useMemo(() => activeFocusCode ? getSuccessors(activeFocusCode) : [], [activeFocusCode, getSuccessors]);
  const activeChain = useMemo(() => activeFocusCode ? [activeFocusCode, ...activePredecessors, ...activeSuccessors] : [], [activeFocusCode, activePredecessors, activeSuccessors]);

  // Viewport dimensions and spacing
  const X_start_offset = 240;
  const Y_start_offset = 80;
  const ColumnWidth = 320;
  
  const allStudyPlanCourses = useMemo(() => {
    return coursesData.map(c => {
      if (ELECTIVE_SEMESTER_MAP[c.code]) {
        return {
          ...c,
          year: ELECTIVE_SEMESTER_MAP[c.code].year,
          semester: ELECTIVE_SEMESTER_MAP[c.code].semester
        };
      }
      return c;
    }).filter(c => c.year !== null && c.semester !== null);
  }, []);

  // 1. Calculate row heights based on the maximum stack count per cell to prevent overlaps
  const trackLayout = useMemo(() => {
    const trackHeights = [];
    const trackY = [];
    
    displayTracks.forEach((track) => {
      let maxStack = 1;
      for (let sem = 1; sem <= 8; sem++) {
        const year = Math.ceil(sem / 2);
        const semesterNum = (sem % 2 === 0) ? 2 : 1;
        
        const count = allStudyPlanCourses.filter(c => 
          c.year === year && 
          c.semester === semesterNum && 
          track.filterKeys.includes(c.track)
        ).length;
        
        if (count > maxStack) {
          maxStack = count;
        }
      }
      // Stagger spacing is 94px. Base padding is 24px.
      const height = maxStack * 94 + 24;
      trackHeights.push(height);
    });

    let currentY = Y_start_offset;
    displayTracks.forEach((_, tIdx) => {
      trackY.push(currentY);
      currentY += trackHeights[tIdx] + 24; // 24px gap between swimlanes
    });

    return { trackHeights, trackY, totalHeight: currentY };
  }, [allStudyPlanCourses]);

  // 2. Generate Nodes for React Flow
  const nodes = useMemo(() => {
    const swimlanes = displayTracks.map((track, tIdx) => ({
      id: `swimlane-${track.key}`,
      type: 'swimlane',
      data: {
        bgColor: track.bgColor,
        borderColor: track.borderColor,
        columnWidth: ColumnWidth
      },
      position: { x: X_start_offset, y: trackLayout.trackY[tIdx] },
      style: { 
        width: 8 * ColumnWidth, 
        height: trackLayout.trackHeights[tIdx], 
        zIndex: -1,
        opacity: activeFocusCode ? 0.15 : 1,
        transition: 'opacity 0.25s'
      },
      draggable: false,
      selectable: false,
      deletable: false
    }));

    const trackLabels = displayTracks.map((track, tIdx) => ({
      id: `track-label-${track.key}`,
      type: 'trackLabel',
      data: {
        label: track.label,
        trackKey: track.key,
        labelBg: track.labelBg,
        labelColor: track.labelColor
      },
      position: { 
        x: 20, 
        y: trackLayout.trackY[tIdx] + (trackLayout.trackHeights[tIdx] - 44) / 2
      },
      style: { 
        width: 200, 
        zIndex: 10,
        opacity: activeFocusCode ? 0.15 : 1,
        transition: 'opacity 0.25s'
      },
      draggable: false,
      selectable: false,
      deletable: false
    }));

    const semesterHeaders = semesters.map((sem, sIdx) => ({
      id: `semester-header-${sIdx}`,
      type: 'semesterHeader',
      data: {
        year: sem.year,
        semester: sem.semester
      },
      position: {
        x: X_start_offset + sIdx * ColumnWidth + 10,
        y: 20
      },
      style: { 
        width: ColumnWidth - 20, 
        zIndex: 10,
        opacity: activeFocusCode ? 0.15 : 1,
        transition: 'opacity 0.25s'
      },
      draggable: false,
      selectable: false,
      deletable: false
    }));

    const courseNodes = [];
    displayTracks.forEach((track, tIdx) => {
      for (let sem = 1; sem <= 8; sem++) {
        const sIdx = sem - 1;
        const year = Math.ceil(sem / 2);
        const semesterNum = (sem % 2 === 0) ? 2 : 1;
        
        const cellCourses = allStudyPlanCourses.filter(c => 
          c.year === year && 
          c.semester === semesterNum && 
          track.filterKeys.includes(c.track)
        );
        
        cellCourses.forEach((course, idx) => {
          const isCompleted = completedCourses.includes(course.code);
          const isUnlocked = unlockedCourses.includes(course.code);
          const isSelected = selectedCourseCode === course.code;
          const isCareerRecommended = careerRecommendedCodes.includes(course.code);
          const { missing = [], isOr = false } = getMissingPrereqs ? getMissingPrereqs(course.code) : {};

          // Check if this course is present in the filtered courses list
          const isFilteredOut = !courses.some(c => c.code === course.code);

          // Path highlight type
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

          // Check Major Elective slot assignment
          const isMajorElectiveSlot = course.category === 'Major_Elective' && course.code.startsWith('MJ-EL-');
          const assignedCourseCode = isMajorElectiveSlot ? selectedMajorElectives[course.code] : null;

          if (isMajorElectiveSlot && !assignedCourseCode) {
            courseNodes.push({
              id: course.code,
              type: 'course',
              data: {
                course,
                isSlotPlaceholder: true,
                isDimmed: isFilteredOut,
                onAddMajorElectiveSlotClick: () => onAddMajorElectiveSlotClick && onAddMajorElectiveSlotClick(course.code)
              },
              position: {
                x: X_start_offset + sIdx * ColumnWidth + (ColumnWidth - 230) / 2,
                y: trackLayout.trackY[tIdx] + 12 + idx * 94
              },
              style: { width: 230, zIndex: 5 },
              draggable: false
            });
            return;
          }

          let isDimmed;
          if (activeFocusCode) {
            isDimmed = !activeChain.includes(course.code) || isFilteredOut;
          } else if (careerFocus) {
            isDimmed = !isCareerRecommended || isFilteredOut;
          } else {
            isDimmed = isFilteredOut;
          }

          courseNodes.push({
            id: course.code,
            type: 'course',
            data: {
              course,
              isCompleted,
              isUnlocked,
              isSelected,
              isCareerRecommended,
              hasActiveCareerFocus: !!careerFocus,
              missingPrereqs: missing,
              isOrPrereq: isOr,
              onClick: () => {
                if (highlightedCourseCode === course.code) {
                  setHighlightedCourseCode(null);
                } else {
                  setHighlightedCourseCode(course.code);
                }
              },
              onDoubleClick: () => onSelectCourse(course.code),
              onOpenDetails: () => onSelectCourse(course.code),
              onToggleComplete,
              selectedGeElectives,
              onSelectGeElective,
              selectedMajorElectives,
              onSelectMajorElective,
              onHoverStart: (code) => { if (!isTouchDevice) setHoveredCourseCode(code); },
              onHoverEnd: () => { if (!isTouchDevice) setHoveredCourseCode(null); },
              highlightType,
              isDimmed
            },
            position: {
              x: X_start_offset + sIdx * ColumnWidth + (ColumnWidth - 230) / 2,
              y: trackLayout.trackY[tIdx] + 12 + idx * 94
            },
            style: { width: 230, zIndex: 5 },
            draggable: false
          });
        });
      }
    });

    return [...swimlanes, ...trackLabels, ...semesterHeaders, ...courseNodes];
  }, [
    trackLayout,
    allStudyPlanCourses,
    courses,
    completedCourses,
    unlockedCourses,
    selectedCourseCode,
    careerFocus,
    careerRecommendedCodes,
    getMissingPrereqs,
    onSelectCourse,
    onToggleComplete,
    selectedGeElectives,
    onSelectGeElective,
    selectedMajorElectives,
    onSelectMajorElective,
    onAddMajorElectiveSlotClick,
    setHoveredCourseCode,
    activeFocusCode,
    activePredecessors,
    activeSuccessors,
    activeChain,
    language,
    highlightedCourseCode,
    setHighlightedCourseCode
  ]);

  // 3. Generate Edges for React Flow
  const edges = useMemo(() => {
    const list = [];
    allStudyPlanCourses.forEach(course => {
      course.prereqs.forEach(preCode => {
        const hasPreNode = allStudyPlanCourses.some(c => c.code === preCode);
        if (hasPreNode) {
          let strokeColor = '#cbd5e1';
          let strokeWidth = 2;
          let animated = false;
          let edgeOpacity = 1;
          
          if (activeFocusCode) {
            // Check if both nodes are in the active focus chain
            const isSourceInChain = activeChain.includes(preCode);
            const isTargetInChain = activeChain.includes(course.code);
            
            if (isSourceInChain && isTargetInChain) {
              // It's part of the highlighted active path!
              strokeWidth = 3.5;
              animated = true;
              // If target is in activeSuccessors or source is the active focus, it's green (unlocks)
              // Otherwise it's red (prerequisites)
              if (activeSuccessors.includes(course.code) || preCode === activeFocusCode) {
                strokeColor = '#10b981'; // Green for unlocked path
              } else {
                strokeColor = '#ef4444'; // Red for prerequisite path
              }
            } else {
              // Dim unrelated edges
              strokeColor = '#e2e8f0';
              strokeWidth = 1;
              edgeOpacity = 0.15;
            }
          } else if (careerFocus) {
            const isSourceRec = careerRecommendedCodes.includes(preCode);
            const isTargetRec = careerRecommendedCodes.includes(course.code);
            if (isSourceRec && isTargetRec) {
              strokeColor = '#f59e0b';
              strokeWidth = 2.5;
            } else {
              strokeColor = '#e2e8f0';
              strokeWidth = 1;
              edgeOpacity = 0.15;
            }
          }
          
          list.push({
            id: `e-${preCode}-${course.code}`,
            source: preCode,
            target: course.code,
            type: 'smoothstep', // Orthogonal step line with rounded corners
            sourceHandle: 'source-right',
            targetHandle: 'target-left',
            animated,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 14,
              height: 14,
              color: strokeColor
            },
            style: { 
              stroke: strokeColor, 
              strokeWidth,
              opacity: edgeOpacity,
              transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s'
            }
          });
        }
      });
    });
    return list;
  }, [allStudyPlanCourses, activeFocusCode, activePredecessors, activeSuccessors, activeChain, careerFocus, careerRecommendedCodes]);

  // Viewport Zoom helper controls
  const handleZoomIn = () => reactFlowInstance && reactFlowInstance.zoomIn();
  const handleZoomOut = () => reactFlowInstance && reactFlowInstance.zoomOut();
  const handleFitView = () => reactFlowInstance && reactFlowInstance.fitView({ duration: 400 });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 select-none">
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#1e293b' }} className="flex items-center gap-2">
              <CompassOutlined style={{ color: '#4f46e5' }} />
              Specialization Tracks Flowchart
            </Title>
            <Paragraph style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Dynamic interactive curriculum canvas. Drag to pan, pinch/wheel to zoom, and hover a subject to trace prerequisite pathways.
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

        {/* Canvas Toolbar Controls */}
        <div className="flex justify-between items-center gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 select-none">
          <Space>
            <Button size="small" icon={<ZoomInOutlined />} onClick={handleZoomIn}>Zoom In</Button>
            <Button size="small" icon={<ZoomOutOutlined />} onClick={handleZoomOut}>Zoom Out</Button>
            <Button size="small" icon={<FullscreenOutlined />} onClick={handleFitView}>Fit View</Button>
          </Space>
          {windowWidth >= 640 && (
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <BlockOutlined /> Miro-style Canvas Active
            </div>
          )}
        </div>

        {/* Dynamic Zoomable Pannable Viewport */}
        <div 
          ref={reactFlowRef}
          style={{ 
            width: '100%', 
            maxWidth: '100%',
            boxSizing: 'border-box',
            height: windowWidth < 640 ? '480px' : '620px', 
            position: 'relative', 
            border: '1px solid #e2e8f0', 
            borderRadius: '16px', 
            overflow: 'hidden',
            background: '#fafbfd' 
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onInit={setReactFlowInstance}
            onPaneClick={handlePaneClick}
            onPaneTouchStart={handlePaneClick}
            fitView
            fitViewOptions={{ padding: 0.05 }}
            panOnScroll={false}
            zoomOnScroll={true}
            zoomOnPinch={true}
            panOnDrag={true}
            minZoom={0.1}
            maxZoom={1.5}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            style={{ width: '100%', height: '100%' }}
          >
            <Controls position="bottom-left" showInteractive={false} />
            <MiniMap 
              position="bottom-right" 
              style={{ height: 100, width: 140, borderRadius: '8px', border: '1px solid #cbd5e1' }} 
              nodeColor={(node) => {
                if (node.type === 'swimlane') return 'rgba(0, 0, 0, 0.01)';
                if (node.type === 'semesterHeader') return '#f8fafc';
                if (node.type === 'trackLabel') return '#475569';
                // color-code course nodes
                const cat = node.data?.course?.category;
                if (cat === 'Core') return '#4f46e5';
                if (cat === 'Major_Required') return '#3b82f6';
                if (cat === 'Major_Elective') return '#10b981';
                return '#94a3b8';
              }} 
              maskColor="rgba(0, 0, 0, 0.03)" 
            />
            <Background color="#94a3b8" gap={20} size={1} opacity={0.3} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
