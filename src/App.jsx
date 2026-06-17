import { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout, Radio, Segmented, Input, Button, Card, Progress, Row, Col, Space, Badge, Collapse, Typography, ConfigProvider, Alert, Drawer, FloatButton, Divider, notification, Tooltip, Pagination } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  UndoOutlined, 
  TrophyOutlined, 
  CodeOutlined, 
  PictureOutlined, 
  SoundOutlined, 
  AimOutlined, 
  QuestionCircleOutlined, 
  BookOutlined, 
  CompassOutlined, 
  CrownOutlined, 
  RocketOutlined,
  PlusOutlined,
  MenuOutlined
} from '@ant-design/icons';
import enUS from 'antd/locale/en_US';
import thTH from 'antd/locale/th_TH';
import { useTranslation } from './context/LanguageContext';
import { coursesData } from './data/courses';
import { TRACK_ELECTIVES } from './constants/trackElectives';
import { careerPaths } from './data/careers';
import CreditTracker from './components/CreditTracker';
import SkillTreeGrid from './components/SkillTreeGrid';
import TracksTreeGrid from './components/TracksTreeGrid';
import CourseDetailModal from './components/CourseDetailModal';
import CourseCard from './components/CourseCard';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function App() {
  const { language, setLanguage, t } = useTranslation();
  const isTh = language === 'th';

  // State: Mobile menu drawer open
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);

  // State: Tap/click persistent connection highlight
  const [highlightedCourseCode, setHighlightedCourseCode] = useState(null);

  // Track if the initial state has been loaded from localStorage to prevent overwriting
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // 1. State: Completed courses list (initially empty, loaded from localStorage in useEffect)
  const [completedCourses, setCompletedCourses] = useState([]);

  // 2. State: Selected course code (for details modal)
  const [selectedCourseCode, setSelectedCourseCode] = useState(null);

  // 3. State: Current View ('semester' | 'tracks')
  const [currentView, setCurrentView] = useState('tracks'); // Default to Tracks Flowchart

  // 4. State: Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // 4.1 State: Career Path Focus ('designer' | 'programmer' | 'artist' | 'sounder' | null)
  const [careerFocus, setCareerFocus] = useState(null);
  
  // Pagination for Major Electives Drawer
  const [drawerPage, setDrawerPage] = useState(1);
  const drawerPageSize = 10;
  const [drawerSearchQuery, setDrawerSearchQuery] = useState('');
  const [drawerTrackFilter, setDrawerTrackFilter] = useState('All');

  // 4.2 State: Hover pathway highlight
  const [hoveredCourseCode, setHoveredCourseCode] = useState(null);

  // 4.3 State: Selected GE Electives mapping
  const [selectedGeElectives, setSelectedGeElectives] = useState({});

  // 4.4 State: Selected Major Electives mapping
  const [selectedMajorElectives, setSelectedMajorElectives] = useState({});

  // 4.5 State: Drawer visibility and active slot target
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSlotTarget, setActiveSlotTarget] = useState(null);


  // Auto-fill major elective slots based on career track
  const autoFillForTrack = useCallback((track) => {
    const slots = coursesData.filter(c => c.code.startsWith('MJ-EL-')).map(c => c.code);
    const available = TRACK_ELECTIVES[track] || [];
    const assignments = { ...selectedMajorElectives };
    const used = new Set(Object.values(assignments));
    let idx = 0;
    slots.forEach(slot => {
      if (!assignments[slot]) {
        while (idx < available.length && used.has(available[idx])) {
          idx++;
        }
        if (idx < available.length) {
          assignments[slot] = available[idx];
          used.add(available[idx]);
          idx++;
        }
      }
    });
    setSelectedMajorElectives(assignments);
  }, [selectedMajorElectives, setSelectedMajorElectives]);

  const careerRecommendedCodes = useMemo(() => {
    return careerFocus && careerPaths[careerFocus]
      ? careerPaths[careerFocus].recommendedCodes
      : [];
  }, [careerFocus]);


  // 1. Initial State Loading (useEffect on Mount)
  useEffect(() => {
    const saved = localStorage.getItem('cmu_dg_planner_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.completedCourses) setCompletedCourses(parsed.completedCourses);
        if (parsed.careerFocus !== undefined) setCareerFocus(parsed.careerFocus);
        if (parsed.selectedGeElectives) setSelectedGeElectives(parsed.selectedGeElectives);
        if (parsed.selectedMajorElectives) setSelectedMajorElectives(parsed.selectedMajorElectives);
      } catch (e) {
        console.error("Error loading localStorage state:", e);
      }
    }
    setIsInitialLoadComplete(true);
  }, []);

  // 2. Auto-Save on State Change (with debounce)
  useEffect(() => {
    if (!isInitialLoadComplete) return;

    const handler = setTimeout(() => {
      const stateToSave = {
        completedCourses,
        careerFocus,
        selectedGeElectives,
        selectedMajorElectives,
      };
      localStorage.setItem('cmu_dg_planner_state', JSON.stringify(stateToSave));
    }, 300);

    return () => clearTimeout(handler);
  }, [completedCourses, careerFocus, selectedGeElectives, selectedMajorElectives, isInitialLoadComplete]);

  // 5. Calculate unlocked courses based on prerequisites
  const getUnlockedCourses = useCallback(() => {
    return coursesData.map(course => {
      // Resolve assigned course for elective slots
      let targetCourse = course;
      if (course.code.startsWith('MJ-EL-') && selectedMajorElectives[course.code]) {
        const assignedCode = selectedMajorElectives[course.code];
        targetCourse = coursesData.find(c => c.code === assignedCode) || course;
      } else if (course.code.startsWith('GE-EL-') && selectedGeElectives[course.code]) {
        const assignedCode = selectedGeElectives[course.code];
        targetCourse = coursesData.find(c => c.code === assignedCode) || course;
      }

      if (targetCourse.prereqs.length === 0) {
        return course.code;
      }
      
      const textTh = targetCourse.prereq_text_th.toLowerCase();
      const isOrRelation = textTh.includes('หรือ') || textTh.includes('or');
      
      if (isOrRelation) {
        const hasOne = targetCourse.prereqs.some(pCode => completedCourses.includes(pCode));
        return hasOne ? course.code : null;
      } else {
        const hasAll = targetCourse.prereqs.every(pCode => completedCourses.includes(pCode));
        return hasAll ? course.code : null;
      }
    }).filter(Boolean);
  }, [completedCourses, selectedMajorElectives, selectedGeElectives]);

  const unlockedCourses = useMemo(() => {
    return getUnlockedCourses();
  }, [getUnlockedCourses]);

  // Helper to find missing prerequisite course codes for a specific course
  const getMissingPrereqs = useCallback((courseCode) => {
    let targetCourse = coursesData.find(c => c.code === courseCode);
    if (!targetCourse) return { missing: [], isOr: false };

    if (courseCode.startsWith('MJ-EL-') && selectedMajorElectives[courseCode]) {
      const assignedCode = selectedMajorElectives[courseCode];
      targetCourse = coursesData.find(c => c.code === assignedCode) || targetCourse;
    } else if (courseCode.startsWith('GE-EL-') && selectedGeElectives[courseCode]) {
      const assignedCode = selectedGeElectives[courseCode];
      targetCourse = coursesData.find(c => c.code === assignedCode) || targetCourse;
    }

    if (targetCourse.prereqs.length === 0) {
      return { missing: [], isOr: false };
    }

    const textTh = targetCourse.prereq_text_th.toLowerCase();
    const isOr = textTh.includes('หรือ') || textTh.includes('or');

    const missing = targetCourse.prereqs.filter(code => !completedCourses.includes(code));

    if (isOr) {
      const hasCompletedPrereq = targetCourse.prereqs.some(code => completedCourses.includes(code));
      return {
        missing: hasCompletedPrereq ? [] : targetCourse.prereqs,
        isOr
      };
    }

    return { missing, isOr };
  }, [completedCourses, selectedMajorElectives, selectedGeElectives]);

  // Toggle course completion status
  const handleToggleComplete = (courseCode) => {
    setCompletedCourses(prev => {
      if (prev.includes(courseCode)) {
        // When unmarking a course, we must also unmark any post-requisites that depend on it!
        const coursesToUnmark = [courseCode];
        
        const findDependents = (code) => {
          coursesData.forEach(c => {
            // Check if course c directly requires code
            const directlyRequires = c.prereqs.includes(code);
            
            // Check if c is assigned to a slot, and that slot requires code
            let isAssignedSlotToRequires = false;
            let slotCode = null;
            if (c.category === 'Major_Elective' || c.category === 'GE_Elective') {
              const slotEntries = Object.entries(selectedMajorElectives).concat(Object.entries(selectedGeElectives));
              const foundSlot = slotEntries.find(([, subCode]) => subCode === c.code);
              if (foundSlot) {
                slotCode = foundSlot[0];
                if (c.prereqs.includes(code)) {
                  isAssignedSlotToRequires = true;
                }
              }
            }

            const targetCode = isAssignedSlotToRequires ? slotCode : c.code;

            if ((directlyRequires || isAssignedSlotToRequires) && !coursesToUnmark.includes(targetCode)) {
              coursesToUnmark.push(targetCode);
              findDependents(targetCode);
              if (targetCode !== c.code) {
                findDependents(c.code);
              }
            }
          });
        };
        
        findDependents(courseCode);
        return prev.filter(code => !coursesToUnmark.includes(code));
      } else {
        if (unlockedCourses.includes(courseCode)) {
          return [...prev, courseCode];
        }
        return prev;
      }
    });
  };

  // Handle GE Elective selection
  const handleSelectGeElective = (slotCode, courseCode) => {
    setSelectedGeElectives(prev => {
      const updated = { ...prev };
      if (courseCode) {
        updated[slotCode] = courseCode;
      } else {
        delete updated[slotCode];
        setCompletedCourses(curr => curr.filter(code => code !== slotCode));
      }
      return updated;
    });
  };

  // Handle Major Elective selection
  const handleSelectMajorElective = (slotCode, courseCode) => {
    setSelectedMajorElectives(prev => {
      const updated = { ...prev };
      if (courseCode) {
        updated[slotCode] = courseCode;
      } else {
        delete updated[slotCode];
        setCompletedCourses(curr => curr.filter(code => code !== slotCode));
      }
      return updated;
    });

    if (courseCode) {
      const course = coursesData.find(c => c.code === courseCode);
      notification.success({
        message: 'Major Elective Assigned',
        description: `Successfully assigned ${course ? course.title_en : courseCode} to slot ${slotCode}.`,
        placement: 'bottomRight',
        duration: 3
      });
    }
  };

  // Calculate accumulated credits per category
  const getCompletedCredits = () => {
    const summary = {
      GE: 0,
      Core: 0,
      Major_Required: 0,
      Major_Elective: 0,
      Free_Elective: 0
    };

    completedCourses.forEach(code => {
      const course = coursesData.find(c => c.code === code);
      if (course) {
        const cat = course.category;
        if (cat === 'GE_Required' || cat === 'GE_Elective') {
          summary.GE += course.credit_count;
        } else {
          summary[cat] += course.credit_count;
        }
      }
    });

    return summary;
  };

  const completedCredits = getCompletedCredits();

  // Preset Progress Loader (Freshman, Sophomore, Junior, Senior)
  const loadPreset = (presetName) => {
    let codes = [];
    if (presetName === 'sophomore') {
      codes = coursesData.filter(c => c.year === 1 && c.year !== null).map(c => c.code);
    } else if (presetName === 'junior') {
      codes = coursesData.filter(c => c.year !== null && (c.year === 1 || c.year === 2)).map(c => c.code);
    } else if (presetName === 'senior') {
      codes = coursesData.filter(c => c.year !== null && c.year <= 3).map(c => c.code);
    }
    setCompletedCourses(codes);
  };

  // Reset all progress
  const handleReset = () => {
    if (window.confirm(t('confirm_reset_content'))) {
      localStorage.removeItem('cmu_dg_planner_state');
      setCompletedCourses([]);
      setSelectedCourseCode(null);
      setSelectedGeElectives({});
      setSelectedMajorElectives({});
      setCareerFocus(null);

      notification.success({
        message: language === 'th' ? 'รีเซ็ตแผนการเรียนสำเร็จ' : 'Planner Reset Successful',
        description: language === 'th' 
          ? 'ความคืบหน้าและวิชาเลือกของคุณถูกล้างเรียบร้อยแล้ว' 
          : 'Your progress and elective assignments have been successfully cleared.',
        placement: 'bottomRight',
        duration: 3
      });
    }
  };

  const handleAddMajorElectiveSlotClick = (slotCode) => {
    setActiveSlotTarget(slotCode);
    setDrawerOpen(true);
  };

  // Filtered Courses for Search
  const filteredCourses = useMemo(() => {
    return coursesData.filter(c => {
      const matchesSearch = c.code.includes(searchQuery) || 
        c.dept_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title_th.toLowerCase().includes(searchQuery.toLowerCase());
        
      if (categoryFilter === 'All') return matchesSearch;
      if (categoryFilter === 'GE') return matchesSearch && (c.category === 'GE_Required' || c.category === 'GE_Elective');
      return matchesSearch && c.category === categoryFilter;
    });
  }, [searchQuery, categoryFilter]);

  const selectedCourse = coursesData.find(c => c.code === selectedCourseCode);

  const getCareerIcon = (key) => {
    switch (key) {
      case 'designer': return <AimOutlined style={{ fontSize: '20px' }} />;
      case 'programmer': return <CodeOutlined style={{ fontSize: '20px' }} />;
      case 'artist': return <PictureOutlined style={{ fontSize: '20px' }} />;
      case 'sounder': return <SoundOutlined style={{ fontSize: '20px' }} />;
      default: return <CrownOutlined style={{ fontSize: '20px' }} />;
    }
  };

  const getCareerColor = (key) => {
    switch (key) {
      case 'designer': return '#f97316'; // orange
      case 'programmer': return '#0ea5e9'; // cyan
      case 'artist': return '#10b981'; // green
      case 'sounder': return '#84cc16'; // lime
      default: return '#6366f1'; // indigo
    }
  };

  return (
    <ConfigProvider
      locale={language === 'th' ? thTH : enUS}
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          fontFamily: "'Inter', sans-serif",
          borderRadius: 12,
        },
      }}
    >
      <Layout className="min-h-screen bg-slate-50">
        {/* Banner Header */}
        <Header 
          style={{ 
            backgroundColor: '#ffffff', 
            height: 'auto', 
            lineHeight: 'normal', 
            borderBottom: '1px solid #f1f5f9',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}
          className="px-4 py-3 sm:px-6"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#4f46e5', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RocketOutlined style={{ color: '#ffffff', fontSize: '22px' }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 900, color: '#1e293b' }} className="text-sm sm:text-base md:text-lg">
                  {t('app_title')}
                </Title>
                <Text style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {t('app_subtitle')}
                </Text>
              </div>
            </div>

            {/* Desktop actions: hidden on mobile/tablet, visible on lg and up */}
            <div className="hidden lg:flex items-center">
              <Space size="middle">
                <div style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginRight: '4px' }}>{t('btn_load_year')}</span>
                  <Button size="small" type={completedCourses.length === 0 ? 'primary' : 'default'} onClick={() => setCompletedCourses([])} style={{ fontSize: '11px', borderRadius: '6px' }}>{t('btn_y1_start')}</Button>
                  <Button size="small" onClick={() => loadPreset('sophomore')} style={{ fontSize: '11px', borderRadius: '6px' }}>{t('btn_y2_start')}</Button>
                  <Button size="small" onClick={() => loadPreset('junior')} style={{ fontSize: '11px', borderRadius: '6px' }}>{t('btn_y3_start')}</Button>
                  <Button size="small" onClick={() => loadPreset('senior')} style={{ fontSize: '11px', borderRadius: '6px' }}>{t('btn_y4_start')}</Button>
                </div>

                <Button
                  type="primary"
                  icon={<BookOutlined />}
                  onClick={() => {
                    setActiveSlotTarget(null);
                    setDrawerOpen(true);
                  }}
                  style={{ fontWeight: 700, borderRadius: '8px', backgroundColor: '#0d9488', borderColor: '#0d9488' }}
                >
                  {t('btn_browse_electives')}
                </Button>

                <Button 
                  danger 
                  icon={<UndoOutlined />} 
                  onClick={handleReset}
                  style={{ fontWeight: 700, borderRadius: '8px' }}
                >
                  {t('btn_reset_planner')}
                </Button>

                <Radio.Group
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  size="small"
                  optionType="button"
                  buttonStyle="solid"
                  style={{ borderRadius: '6px', overflow: 'hidden' }}
                >
                  <Radio.Button value="en" style={{ fontWeight: 700 }}>EN</Radio.Button>
                  <Radio.Button value="th" style={{ fontWeight: 700 }}>TH</Radio.Button>
                </Radio.Group>
              </Space>
            </div>

            {/* Mobile/Tablet actions Hamburger button */}
            <div className="flex lg:hidden">
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: '20px' }} />}
                onClick={() => setMenuDrawerOpen(true)}
                style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </div>
          </div>
        </Header>

        {/* Mobile/Tablet Actions Slide-out Drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RocketOutlined style={{ color: '#4f46e5', fontSize: '18px' }} />
              <span style={{ fontWeight: 800, fontSize: '15px' }}>{t('menu_actions')}</span>
            </div>
          }
          placement="right"
          onClose={() => setMenuDrawerOpen(false)}
          open={menuDrawerOpen}
          width={280}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Load Year Presets */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                {t('btn_load_year')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <Button size="middle" type={completedCourses.length === 0 ? 'primary' : 'default'} onClick={() => { setCompletedCourses([]); setMenuDrawerOpen(false); }} style={{ fontSize: '11px', borderRadius: '8px' }}>{t('btn_y1_start')}</Button>
                <Button size="middle" onClick={() => { loadPreset('sophomore'); setMenuDrawerOpen(false); }} style={{ fontSize: '11px', borderRadius: '8px' }}>{t('btn_y2_start')}</Button>
                <Button size="middle" onClick={() => { loadPreset('junior'); setMenuDrawerOpen(false); }} style={{ fontSize: '11px', borderRadius: '8px' }}>{t('btn_y3_start')}</Button>
                <Button size="middle" onClick={() => { loadPreset('senior'); setMenuDrawerOpen(false); }} style={{ fontSize: '11px', borderRadius: '8px' }}>{t('btn_y4_start')}</Button>
              </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button
                type="primary"
                icon={<BookOutlined />}
                onClick={() => {
                  setActiveSlotTarget(null);
                  setDrawerOpen(true);
                  setMenuDrawerOpen(false);
                }}
                style={{ width: '100%', fontWeight: 700, borderRadius: '8px', backgroundColor: '#0d9488', borderColor: '#0d9488', height: '40px' }}
              >
                {t('btn_browse_electives')}
              </Button>

              <Button 
                danger 
                icon={<UndoOutlined />} 
                onClick={() => {
                  handleReset();
                  setMenuDrawerOpen(false);
                }}
                style={{ width: '100%', fontWeight: 700, borderRadius: '8px', height: '40px' }}
              >
                {t('btn_reset_planner')}
              </Button>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Language Switcher */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Language / ภาษา
              </div>
              <Radio.Group
                value={language}
                onChange={(e) => { setLanguage(e.target.value); setMenuDrawerOpen(false); }}
                size="middle"
                optionType="button"
                buttonStyle="solid"
                style={{ width: '100%', display: 'flex', borderRadius: '8px', overflow: 'hidden' }}
              >
                <Radio.Button value="en" style={{ flex: 1, textAlign: 'center', fontWeight: 700 }}>English</Radio.Button>
                <Radio.Button value="th" style={{ flex: 1, textAlign: 'center', fontWeight: 700 }}>ภาษาไทย</Radio.Button>
              </Radio.Group>
            </div>
          </div>
        </Drawer>

        {/* Content Body */}
        <Content style={{ padding: '32px 24px', width: '100%' }}>
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Credit Tracker Dashboard widget */}
            <CreditTracker completedCredits={completedCredits} />

            {/* Collapsible Prerequisite Guidelines */}
            <Collapse 
              ghost
              style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '16px' }}
              expandIconPosition="right"
              defaultActiveKey={['1']}
            >
              <Collapse.Panel 
                key="1" 
                header={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <QuestionCircleOutlined style={{ color: '#4f46e5', fontSize: '18px' }} />
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{t('guideline_title')}</span>
                      <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginTop: '2px' }}>{t('guideline_subtitle')}</span>
                    </div>
                  </div>
                }
              >
                <Row gutter={[24, 24]} style={{ padding: '0 12px 12px 12px', fontSize: '12.5px', color: '#475569' }}>
                  <Col xs={24} md={8}>
                    <Title level={5} style={{ fontWeight: 900, color: '#e11d48', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', marginRight: '6px' }}></span>
                      {t('guideline_col1_title')}
                    </Title>
                    <Paragraph style={{ fontSize: '12px', lineHeight: '1.6' }}>
                      {t('guideline_col1_p1')}
                    </Paragraph>
                    <ul style={{ paddingLeft: '16px', listStyleType: 'disc', fontSize: '12px', lineHeight: '1.7', fontWeight: 600 }}>
                      <li>{t('guideline_col1_li1')}</li>
                      <li>{t('guideline_col1_li2')}</li>
                    </ul>
                  </Col>

                  <Col xs={24} md={8} style={{ borderLeft: '1px solid #f1f5f9' }}>
                    <Title level={5} style={{ fontWeight: 900, color: '#3b82f6', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', marginRight: '6px' }}></span>
                      {t('guideline_col2_title')}
                    </Title>
                    <Paragraph style={{ fontSize: '12px', lineHeight: '1.6' }}>
                      {t('guideline_col2_p1')}
                    </Paragraph>
                    <Alert 
                      message={t('guideline_col2_alert')}
                      type="warning" 
                      showIcon 
                      style={{ fontSize: '11px', padding: '8px 12px', borderRadius: '8px' }}
                    />
                  </Col>

                  <Col xs={24} md={8} style={{ borderLeft: '1px solid #f1f5f9' }}>
                    <Title level={5} style={{ fontWeight: 900, color: '#f59e0b', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', marginRight: '6px' }}></span>
                      {t('guideline_col3_title')}
                    </Title>
                    <Paragraph style={{ fontSize: '12px', lineHeight: '1.6' }}>
                      {t('guideline_col3_p1')}
                    </Paragraph>
                    <ul style={{ paddingLeft: '16px', listStyleType: 'disc', fontSize: '12px', lineHeight: '1.7', fontWeight: 600 }}>
                      <li>{t('guideline_col3_li1')}</li>
                      <li>{t('guideline_col3_li2')}</li>
                    </ul>
                  </Col>
                </Row>
              </Collapse.Panel>
            </Collapse>

            {/* Career Goals Filter Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 select-none">
                <TrophyOutlined style={{ color: '#4f46e5', fontSize: '18px' }} />
                <div>
                  <Title level={5} style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>
                    {t('career_title')}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {t('career_subtitle')}
                  </Text>
                </div>
              </div>

              <Row gutter={[16, 16]}>
                {Object.entries(careerPaths).map(([key, path]) => {
                  const totalCourses = path.recommendedCodes.length;
                  const completedCount = path.recommendedCodes.filter(code => completedCourses.includes(code)).length;
                  const percent = Math.round((completedCount / totalCourses) * 100);
                  const isActive = careerFocus === key;
                  const careerColor = getCareerColor(key);

                  return (
                    <Col xs={24} sm={12} lg={6} key={key}>
                      <Card
                        hoverable
                        onClick={() => setCareerFocus(isActive ? null : key)}
                        style={{
                          borderRadius: '16px',
                          borderWidth: isActive ? '2px' : '1px',
                          borderColor: isActive ? careerColor : '#e2e8f0',
                          backgroundColor: isActive ? `${careerColor}03` : '#ffffff',
                          boxShadow: isActive ? `0 4px 12px ${careerColor}15` : 'none',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.25s'
                        }}
                        bodyStyle={{ 
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '100%',
                          flexGrow: 1
                        }}
                        className="hover:scale-[1.01] transition-transform duration-200"
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ backgroundColor: isActive ? careerColor : '#f1f5f9', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: isActive ? '#ffffff' : '#64748b' }}>
                                {getCareerIcon(key)}
                              </span>
                            </div>
                            {isActive && (
                              <Badge status="processing" text={
                                <span style={{ fontSize: '10px', fontWeight: 800, color: careerColor, textTransform: 'uppercase' }}>{t('career_active_path')}</span>
                              } />
                            )}
                          </div>

                          <Title level={5} style={{ margin: '0 0 2px 0', fontWeight: 800, color: '#1e293b', fontSize: '14px' }}>
                            {isTh ? path.title_th : path.title_en}
                          </Title>
                          <Paragraph style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
                            {isTh ? path.description_th : path.description_en}
                          </Paragraph>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                            <span>{t('career_requisites')}</span>
                            <span>{completedCount} / {totalCourses} {t('career_passed')}</span>
                          </div>
                          <Progress 
                            percent={percent} 
                            strokeColor={careerColor} 
                            trailColor="#e2e8f0"
                            strokeWidth={6}
                            showInfo={false}
                          />
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>

              {/* Dynamic Path Guidance helper message */}
              {careerFocus && (
                <Card 
                  size="small" 
                  style={{ borderRadius: '12px', border: '1px dashed #cbd5e1', backgroundColor: '#f8fafc' }}
                  bodyStyle={{ padding: '16px 20px' }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <Text strong style={{ color: getCareerColor(careerFocus), fontSize: '13px' }}>
                        🎯 {t('guidance_filter_enabled')}: {isTh ? careerPaths[careerFocus].title_th : careerPaths[careerFocus].title_en}
                      </Text>
                      <Paragraph style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748b' }}>
                        {t('guidance_filter_desc')}
                      </Paragraph>
                    </div>
                    <Button size="small" type="dashed" onClick={() => setCareerFocus(null)} style={{ borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                      {t('btn_clear_filter')}
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* View switcher Segmented */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Segmented
                options={[
                  { label: t('view_tracks'), value: 'tracks', icon: <CompassOutlined /> },
                  { label: t('view_semester'), value: 'semester', icon: <BookOutlined /> }
                ]}
                value={currentView}
                onChange={setCurrentView}
                size="large"
                style={{ 
                  backgroundColor: '#e2e8f0', 
                  padding: '4px',
                  borderRadius: '14px',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                }}
                className="view-switcher-segmented"
              />
            </div>

            {/* Toolbar: Search input & Category dropdown selector */}
            <div className="bg-white border border-slate-100 p-3 sm:p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <Input 
                placeholder={t('search_placeholder')}
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ maxWidth: '400px', width: '100%', borderRadius: '10px' }}
                allowClear
              />

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-none pb-1 md:pb-0">
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="flex items-center gap-1 shrink-0">
                  <FilterOutlined /> {t('filter_category')}
                </span>
                <div className="overflow-x-auto scrollbar-none">
                  <Radio.Group 
                    value={categoryFilter} 
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                    size="small"
                    className="flex flex-nowrap"
                  >
                    <Radio.Button value="All" className="shrink-0">{t('cat_all')}</Radio.Button>
                    <Radio.Button value="GE" className="shrink-0">{t('cat_ge')}</Radio.Button>
                    <Radio.Button value="Core" className="shrink-0">{t('cat_core')}</Radio.Button>
                    <Radio.Button value="Major_Required" className="shrink-0">{t('cat_major_req')}</Radio.Button>
                    <Radio.Button value="Major_Elective" className="shrink-0">{t('cat_major_elec')}</Radio.Button>
                    <Radio.Button value="Free_Elective" className="shrink-0">{t('cat_free_elec')}</Radio.Button>
                  </Radio.Group>
                </div>
              </div>
            </div>

            {/* Main Flowchart / Timeline component */}
            {currentView === 'semester' ? (
              <SkillTreeGrid 
                courses={filteredCourses}
                completedCourses={completedCourses}
                unlockedCourses={unlockedCourses}
                selectedCourseCode={selectedCourseCode}
                careerFocus={careerFocus}
                careerRecommendedCodes={careerRecommendedCodes}
                getMissingPrereqs={getMissingPrereqs}
                onSelectCourse={setSelectedCourseCode}
                onToggleComplete={handleToggleComplete}
                selectedGeElectives={selectedGeElectives}
                onSelectGeElective={handleSelectGeElective}
                selectedMajorElectives={selectedMajorElectives}
                onSelectMajorElective={handleSelectMajorElective}
                onAddMajorElectiveSlotClick={handleAddMajorElectiveSlotClick}
                hoveredCourseCode={hoveredCourseCode}
                setHoveredCourseCode={setHoveredCourseCode}
                highlightedCourseCode={highlightedCourseCode}
                setHighlightedCourseCode={setHighlightedCourseCode}
              />
            ) : (
              <TracksTreeGrid 
                courses={filteredCourses}
                completedCourses={completedCourses}
                unlockedCourses={unlockedCourses}
                selectedCourseCode={selectedCourseCode}
                careerFocus={careerFocus}
                careerRecommendedCodes={careerRecommendedCodes}
                getMissingPrereqs={getMissingPrereqs}
                onSelectCourse={setSelectedCourseCode}
                onToggleComplete={handleToggleComplete}
                selectedGeElectives={selectedGeElectives}
                onSelectGeElective={handleSelectGeElective}
                selectedMajorElectives={selectedMajorElectives}
                onSelectMajorElective={handleSelectMajorElective}
                onAddMajorElectiveSlotClick={handleAddMajorElectiveSlotClick}
                hoveredCourseCode={hoveredCourseCode}
                setHoveredCourseCode={setHoveredCourseCode}
                highlightedCourseCode={highlightedCourseCode}
                setHighlightedCourseCode={setHighlightedCourseCode}
              />
            )}
          </div>
        </Content>

        {/* Footer info */}
        <Footer style={{ textAlign: 'center', backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9', padding: '24px' }}>
          <Text style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
            {t('footer_copyright')}
          </Text>
          <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '4px' }}>
            {t('footer_desc')}
          </div>
        </Footer>

        {/* Course Details Modal */}
        {selectedCourseCode && (
          <CourseDetailModal 
            course={selectedCourse}
            onClose={() => setSelectedCourseCode(null)}
            isCompleted={completedCourses.includes(selectedCourseCode)}
            isUnlocked={unlockedCourses.includes(selectedCourseCode)}
            onToggleComplete={handleToggleComplete}
            allCourses={coursesData}
            completedCourses={completedCourses}
            onSelectCourse={setSelectedCourseCode}
            selectedGeElectives={selectedGeElectives}
            onSelectGeElective={handleSelectGeElective}
            selectedMajorElectives={selectedMajorElectives}
            onSelectMajorElective={handleSelectMajorElective}
            onAddMajorElectiveSlotClick={handleAddMajorElectiveSlotClick}
          />
        )}

        {/* Major Electives Drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Title level={5} style={{ margin: 0, fontWeight: 900, color: '#1e293b' }}>
                {activeSlotTarget ? t('drawer_title_assign') : t('drawer_title_browse')}
              </Title>
              {activeSlotTarget && (
                <Text style={{ fontSize: '11px', color: '#6366f1', fontWeight: 700 }}>
                  {t('drawer_target_slot')}: {activeSlotTarget} ({isTh ? coursesData.find(c => c.code === activeSlotTarget)?.title_th : coursesData.find(c => c.code === activeSlotTarget)?.title_en})
                </Text>
              )}
              {/* Auto-Fill Button when a career focus is selected and browsing pool */}
              {careerFocus && !activeSlotTarget && (
                <Button
                  size="small"
                  type="primary"
                  onClick={() => autoFillForTrack(careerFocus)}
                  style={{ marginTop: '4px', borderRadius: '6px' }}
                >
                  {t('drawer_autofill', { track: isTh ? careerPaths[careerFocus].title_th : careerPaths[careerFocus].title_en })}
                </Button>
              )}
            </div>
          }
          placement="right"
          onClose={() => {
            setDrawerOpen(false);
            setActiveSlotTarget(null);
            setDrawerSearchQuery('');
            setDrawerTrackFilter('All');
            setDrawerPage(1);
          }}
          open={drawerOpen}
          width={480}
          bodyStyle={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {/* Drawer Search & Track Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input 
              placeholder={t('drawer_search_placeholder')}
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={drawerSearchQuery}
              onChange={(e) => {
                setDrawerSearchQuery(e.target.value);
                setDrawerPage(1);
              }}
              allowClear
              style={{ borderRadius: '8px' }}
            />
            
            <div>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                {t('drawer_filter_track')}
              </span>
              <Radio.Group 
                value={drawerTrackFilter} 
                onChange={(e) => {
                  setDrawerTrackFilter(e.target.value);
                  setDrawerPage(1);
                }}
                optionType="button"
                buttonStyle="solid"
                size="small"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}
              >
                <Radio.Button value="All" style={{ fontSize: '11px', borderRadius: '4px' }}>{t('cat_all')}</Radio.Button>
                <Radio.Button value="Programmer" style={{ fontSize: '11px', borderRadius: '4px' }}>Prog/Dev</Radio.Button>
                <Radio.Button value="Artist" style={{ fontSize: '11px', borderRadius: '4px' }}>Artist</Radio.Button>
                <Radio.Button value="Design" style={{ fontSize: '11px', borderRadius: '4px' }}>Design</Radio.Button>
                <Radio.Button value="Sounder" style={{ fontSize: '11px', borderRadius: '4px' }}>Sound</Radio.Button>
                <Radio.Button value="ETC" style={{ fontSize: '11px', borderRadius: '4px' }}>Misc</Radio.Button>
              </Radio.Group>
            </div>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          {/* Drawer Course List */}
          <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }} className="space-y-4">
            {(() => {
              const pool = coursesData.filter(c => c.category === 'Major_Elective' && c.year === null && c.semester === null);
              
              let filteredPool = pool.filter(c => {
                const matchesSearch = c.code.includes(drawerSearchQuery) || 
                  c.dept_code.toLowerCase().includes(drawerSearchQuery.toLowerCase()) ||
                  c.title_en.toLowerCase().includes(drawerSearchQuery.toLowerCase()) ||
                  c.title_th.toLowerCase().includes(drawerSearchQuery.toLowerCase());
                return matchesSearch;
              });

              if (drawerTrackFilter !== 'All') {
                filteredPool = filteredPool.filter(c => {
                  if (drawerTrackFilter === 'Programmer') {
                    return c.track === 'Programmer' || c.track === 'Dev';
                  }
                  return c.track === drawerTrackFilter;
                });
              }

              const selectedElsewhere = Object.entries(selectedMajorElectives)
                .filter(([slot]) => slot !== activeSlotTarget)
                .map(([, code]) => code);

              if (filteredPool.length === 0) {
                return (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0', fontSize: '13px' }}>
                    {t('drawer_no_match')}
                  </div>
                );
              }

              // Pagination calculations
              const total = filteredPool.length;
              const startIdx = (drawerPage - 1) * drawerPageSize;
              const paged = filteredPool.slice(startIdx, startIdx + drawerPageSize);

              return (
                <>
                  {paged.map(course => {
                    const isCompleted = completedCourses.includes(course.code);
                    const isUnlocked = unlockedCourses.includes(course.code);
                    const isSelected = selectedCourseCode === course.code;
                    const isCareerRecommended = careerRecommendedCodes.includes(course.code);
                    const { missing = [], isOr = false } = getMissingPrereqs(course.code);
                    const isAlreadyAssigned = selectedElsewhere.includes(course.code);

                    return (
                      <div key={course.code} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <CourseCard
                            course={course}
                            isCompleted={isCompleted}
                            isUnlocked={isUnlocked}
                            isSelected={isSelected}
                            isCareerRecommended={isCareerRecommended}
                            hasActiveCareerFocus={!!careerFocus}
                            missingPrereqs={missing}
                            isOrPrereq={isOr}
                            onClick={() => setSelectedCourseCode(course.code)}
                            onToggleComplete={handleToggleComplete}
                            onHoverStart={setHoveredCourseCode}
                            onHoverEnd={() => setHoveredCourseCode(null)}
                            isDimmed={isAlreadyAssigned}
                          />
                        </div>
                        {activeSlotTarget && (
                          <Tooltip title={isAlreadyAssigned ? t('assigned_elsewhere_tooltip') : t('assign_slot_tooltip')}>
                            <Button
                              type="primary"
                              shape="circle"
                              icon={<PlusOutlined />}
                              disabled={isAlreadyAssigned}
                              onClick={() => {
                                handleSelectMajorElective(activeSlotTarget, course.code);
                                setDrawerOpen(false);
                                setActiveSlotTarget(null);
                              }}
                              style={{
                                backgroundColor: isAlreadyAssigned ? undefined : '#0d9488',
                                borderColor: isAlreadyAssigned ? undefined : '#0d9488',
                                boxShadow: isAlreadyAssigned ? undefined : '0 2px 6px rgba(13, 148, 136, 0.2)'
                              }}
                            />
                          </Tooltip>
                        )}
                      </div>
                    );
                  })}
                  <Pagination
                    current={drawerPage}
                    pageSize={drawerPageSize}
                    total={total}
                    onChange={page => setDrawerPage(page)}
                    style={{ textAlign: 'center', marginTop: 12 }}
                    size="small"
                    showSizeChanger={false}
                  />
                </>
              );
            })()}
          </div>
        
        </Drawer>

        {/* Floating Action Button (FAB) */}
        <FloatButton
          type="primary"
          icon={<BookOutlined />}
          tooltip={<div>{t('fab_tooltip')}</div>}
          onClick={() => {
            setActiveSlotTarget(null);
            setDrawerOpen(true);
          }}
          style={{ right: 24, bottom: 24, width: 48, height: 48 }}
        />
      </Layout>
    </ConfigProvider>
  );
}
