import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const resources = {
  en: {
    app_title: "CMU CAMT Digital Games",
    app_subtitle: "Interactive Curriculum Planner & Skill Tree (2567 Scheme)",
    btn_load_year: "Load Year:",
    btn_y1_start: "Y1 Start",
    btn_y2_start: "Y2 Start",
    btn_y3_start: "Y3 Start",
    btn_y4_start: "Y4 Start",
    btn_browse_electives: "Browse Major Electives",
    btn_reset_planner: "Reset Planner",
    menu_actions: "Planner Actions",
    info_icon_tooltip: "Click/tap to view details",
    
    guideline_title: "Prerequisite Flowchart Advising Guidelines",
    guideline_subtitle: "Understanding path connections, locks, and enrollment rules",
    guideline_col1_title: "Pathway Connections",
    guideline_col1_p1: "Hovering or selecting any course card traces its prerequisite structure:",
    guideline_col1_li1: "Red Curved Lines: Trace backward to prerequisite subjects you must complete.",
    guideline_col1_li2: "Green Curved Lines: Trace forward to unlockable future subjects.",
    
    guideline_col2_title: "Lock & Unlock Mechanics",
    guideline_col2_p1: "Courses start as Locked. When you complete all of a course's prerequisites, it turns into Unlocked, enabling you to enroll.",
    guideline_col2_alert: "Locked course cards display missing prerequisites directly inside the card (e.g. Req: 958111) to help you plan!",
    
    guideline_col3_title: "Complex Mappings (AND vs OR)",
    guideline_col3_p1: "Prerequisites follow logical gates:",
    guideline_col3_li1: "AND (Separated by &): You must pass ALL listed prerequisites (e.g. Programming 1 & Math).",
    guideline_col3_li2: "OR (Separated by / or หรือ): You can pass ANY one of the listed prerequisites (e.g. Art for Games or Drawing).",
    
    career_title: "Career Guidance Pathways",
    career_subtitle: "Select a target career track. The flowchart will immediately highlight the recommended courses and dim others.",
    career_active_path: "Active Path",
    career_requisites: "Requisite Checklist",
    career_passed: "Passed",
    guidance_filter_enabled: "Guidance Filter Enabled",
    guidance_filter_desc: "Recommended courses are highlighted with a gold dot. Click on any course to jump to details, or mark it complete.",
    btn_clear_filter: "Clear Filter",
    
    view_tracks: "Specialization Tracks Flowchart",
    view_semester: "Semester Study Plan Timeline",
    
    search_placeholder: "Search subject code, title (EN/TH) or abbreviation...",
    filter_category: "Filter Category:",
    cat_all: "All Subjects",
    cat_ge: "General Ed",
    cat_core: "Core Courses",
    cat_major_req: "Major Req",
    cat_major_elec: "Major Elec",
    cat_free_elec: "Free Elec",
    
    footer_copyright: "© 2026 Chiang Mai University — College of Arts, Media and Technology. All rights reserved.",
    footer_desc: "Interactive Advising Flowchart for B.Sc. Digital Games program. Built with React, Tailwind and Ant Design.",
    
    modal_close: "Close Details",
    modal_mark_complete: "Mark as Completed",
    modal_mark_incomplete: "Mark as Incomplete",
    modal_select_ge: "Select GE Elective Course:",
    modal_select_placeholder: "-- Choose/Change Subject --",
    
    drawer_title_assign: "Assign Major Elective Slot",
    drawer_title_browse: "Browse Major Electives Pool",
    drawer_target_slot: "Target Slot",
    drawer_autofill: "Auto‑Fill {{track}} Slots",
    drawer_search_placeholder: "Search elective code, title, etc...",
    drawer_filter_track: "Filter by Track:",
    drawer_no_match: "No matching Major Electives found.",
    fab_tooltip: "Browse Major Electives Pool",
    
    card_cr: "Cr",
    card_passed: "Passed",
    card_ready: "Ready",
    card_locked: "Locked",
    card_choose_elective: "Choose Elective...",
    card_req: "Req:",
    card_or: "OR",
    card_category: "Category:",
    card_credits: "Credits:",
    tooltip_choose_ge: "💡 Click to choose a General Ed Elective",
    tooltip_locked: "⚠️ Locked. Requires:",
    assign_slot_tooltip: "Assign to slot",
    assigned_elsewhere_tooltip: "Assigned in another slot",
    
    confirm_reset_title: "Reset Planner",
    confirm_reset_content: "Are you sure you want to clear all completed courses progress and elective assignments?",
    confirm_yes: "Yes",
    confirm_no: "No",
    theme_light: "Switch to Light Mode",
    theme_dark: "Switch to Dark Mode",
    
    year: "Year",
    semester: "Semester",
    
    // Tracks
    track_core: "Core Subjects",
    track_programmer: "Programmer Track",
    track_artist: "Artist Track",
    track_designer: "Designer Track",
    track_misc: "Misc (GE & Sound)",
    
    // Course Detail Modal
    course_overview: "Course Overview & Syllabus",
    lecture_hours: "Lecture Hours",
    lab_practice: "Lab Practice",
    self_study: "Self Study",
    learning_prep_tips: "Learning Prep & Advising Tips",
    recommended_software: "Recommended Software to Install:",
    key_skills_concepts: "Key Skills & Concepts taught:",
    no_software_needed: "No custom software needed (Standard tools or web browser)",
    foundational_skills: "Foundational academic capabilities",
    keywords: "Keywords:",
    no_description: "No description available in the official CMU syllabus registry. Focuses on foundational competencies required for Digital Games majors.",
    major_elec_status: "Major Elective Assignment Status:",
    assigned: "Assigned:",
    change_course: "Change Course",
    remove_assignment: "Remove Assignment",
    no_major_assigned: "No Major Elective assigned to this slot yet.",
    browse_assign_course: "Browse & Assign Course",
    
    course_completed: "Course Completed",
    course_completed_desc: "You have successfully passed this course and met its requirements.",
    eligible_to_enroll: "Unlocked & Eligible to Enroll",
    eligible_to_enroll_desc: "All prerequisites are met. You can select this course in your schedule.",
    prereqs_locked: "Prerequisites Locked",
    prereqs_locked_desc: "You must complete required prior courses before enrolling. Missing prerequisites:",
    at_least_one_of: "At least one of",
    all_of: "All of"
  },
  th: {
    app_title: "วิชาเอกดิจิทัลเกมส์ มช.",
    app_subtitle: "ระบบวางแผนหลักสูตรและแผนภูมิทักษะเชิงตอบโต้ (หลักสูตร 2567)",
    btn_load_year: "เลือกชั้นปีเริ่มต้น:",
    btn_y1_start: "ปี 1 เริ่มต้น",
    btn_y2_start: "ปี 2 เริ่มต้น",
    btn_y3_start: "ปี 3 เริ่มต้น",
    btn_y4_start: "ปี 4 เริ่มต้น",
    btn_browse_electives: "ดูคลังวิชาเอกเลือก",
    btn_reset_planner: "รีเซ็ตแผนการเรียน",
    menu_actions: "เมนูจัดการแผนการเรียน",
    info_icon_tooltip: "คลิก/แตะเพื่อดูรายละเอียด",
    
    guideline_title: "คำแนะนำการใช้งานแผนภูมิรายวิชาบังคับก่อน",
    guideline_subtitle: "ทำความเข้าใจการเชื่อมโยงเส้นทางรายวิชา เงื่อนไขการล็อก และกฎการลงทะเบียนเรียน",
    guideline_col1_title: "การเชื่อมโยงเส้นทาง",
    guideline_col1_p1: "เมื่อชี้หรือกดเลือกที่การ์ดวิชาใดๆ จะปรากฏเส้นทางวิชาบังคับก่อนดังนี้:",
    guideline_col1_li1: "เส้นโค้งสีแดง: ลากย้อนกลับไปยังวิชาบังคับก่อนหน้า (Prerequisites) ที่ต้องเรียนให้ผ่านก่อน",
    guideline_col1_li2: "เส้นโค้งสีเกลียวเขียว: ลากต่อไปข้างหน้ายังวิชาในอนาคตที่สามารถลงเรียนได้หลังผ่านวิชานี้",
    
    guideline_col2_title: "กลไกการล็อกและปลดล็อก",
    guideline_col2_p1: "รายวิชาจะเริ่มต้นด้วยสถานะ 'ล็อก' เมื่อคุณผ่านวิชาบังคับก่อนครบทุกวิชาแล้ว การ์ดวิชาจะเปลี่ยนเป็น 'ปลดล็อก' ซึ่งพร้อมสำหรับการลงเรียน",
    guideline_col2_alert: "รายวิชาที่ยังล็อกอยู่จะแสดงวิชาบังคับก่อนที่ยังไม่ผ่านบนการ์ดโดยตรง (เช่น Req: 958111) เพื่อช่วยวางแผนการเรียนได้ง่ายขึ้น!",
    
    guideline_col3_title: "เงื่อนไขซับซ้อน (AND vs OR)",
    guideline_col3_p1: "วิชาบังคับก่อนจะเป็นไปตามเงื่อนไขทางตรรกศาสตร์:",
    guideline_col3_li1: "AND (คั่นด้วย &): ต้องเรียนผ่านวิชาบังคับก่อนทั้งหมดที่ระบุ (เช่น Programming 1 และ Math)",
    guideline_col3_li2: "OR (คั่นด้วย / หรือ หรือ): สามารถเรียนผ่านวิชาใดวิชาหนึ่งก็พอ (เช่น Art for Games หรือ Drawing)",
    
    career_title: "แนะนำเส้นทางการเรียนตามสายอาชีพ",
    career_subtitle: "เลือกสายอาชีพที่คุณสนใจ แผนภูมิจะไฮไลท์วิชาแนะนำสำหรับสายอาชีพนั้นทันทีและลดความสว่างของวิชาอื่น",
    career_active_path: "เส้นทางปัจจุบัน",
    career_requisites: "วิชาแนะนำสำหรับสายอาชีพ",
    career_passed: "เรียนผ่านแล้ว",
    guidance_filter_enabled: "เปิดใช้ตัวกรองเส้นทางแนะนำสำหรับ:",
    guidance_filter_desc: "รายวิชาที่แนะนำจะมีจุดสีทองกำกับไว้ คุณสามารถคลิกที่การ์ดเพื่อดูรายละเอียดเพิ่มเติมหรือติ๊กเพื่อบันทึกว่าเรียนผ่านแล้ว",
    btn_clear_filter: "ล้างตัวกรอง",
    
    view_tracks: "แผนภูมิแยกตามสายวิชาเฉพาะทาง",
    view_semester: "แผนการเรียนแยกตามเทอมศึกษา",
    
    search_placeholder: "ค้นหาด้วยรหัสวิชา, ชื่อวิชา (ไทย/อังกฤษ) หรือตัวย่อ...",
    filter_category: "ตัวกรองประเภทวิชา:",
    cat_all: "ทุกวิชา",
    cat_ge: "ศึกษาทั่วไป (GE)",
    cat_core: "วิชาแกน",
    cat_major_req: "เอกบังคับ",
    cat_major_elec: "เอกเลือก",
    cat_free_elec: "เลือกเสรี",
    
    footer_copyright: "© 2026 มหาวิทยาลัยเชียงใหม่ — วิทยาลัยศิลปะ สื่อ และเทคโนโลยี. สงวนลิขสิทธิ์.",
    footer_desc: "แผนภูมิการแนะนำรายวิชาเชิงตอบโต้สำหรับหลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาดิจิทัลเกมส์ พัฒนาด้วย React, Tailwind และ Ant Design",
    
    modal_close: "ปิดรายละเอียด",
    modal_mark_complete: "ทำเครื่องหมายเรียนผ่านแล้ว",
    modal_mark_incomplete: "ทำเครื่องหมายยังไม่ได้เรียน",
    modal_select_ge: "เลือกวิชาศึกษาทั่วไปเลือก (GE Elective):",
    modal_select_placeholder: "-- เลือก/เปลี่ยนวิชาเรียน --",
    
    drawer_title_assign: "จัดวิชาลงในช่องวิชาเอกเลือก",
    drawer_title_browse: "คลังรายวิชาเอกเลือก",
    drawer_target_slot: "ช่องเรียนวิชาเลือก:",
    drawer_autofill: "จัดวิชาเรียนอัตโนมัติสำหรับสาย {{track}}",
    drawer_search_placeholder: "ค้นหารหัสวิชา, ชื่อวิชาเอกเลือก...",
    drawer_filter_track: "กรองตามกลุ่มวิชาเฉพาะ:",
    drawer_no_match: "ไม่พบวิชาเอกเลือกที่ตรงกับคำค้นหา",
    fab_tooltip: "เปิดคลังรายวิชาเอกเลือก",
    
    card_cr: "หน่วยกิต",
    card_passed: "ผ่านแล้ว",
    card_ready: "พร้อมเรียน",
    card_locked: "ล็อกอยู่",
    card_choose_elective: "เลือกวิชาเลือก...",
    card_req: "Req:",
    card_or: "หรือ",
    card_category: "ประเภท:",
    card_credits: "หน่วยกิต:",
    tooltip_choose_ge: "💡 คลิกเพื่อเลือกวิชาศึกษาทั่วไปเลือก",
    tooltip_locked: "⚠️ ล็อกอยู่ ต้องผ่านวิชาบังคับก่อน:",
    assign_slot_tooltip: "ลงเรียนในช่องนี้",
    assigned_elsewhere_tooltip: "ลงเรียนไว้ในช่องอื่นแล้ว",
    
    confirm_reset_title: "ยืนยันการรีเซ็ตแผนการเรียน",
    confirm_reset_content: "คุณแน่ใจหรือไม่ที่จะล้างความคืบหน้าวิชาที่เรียนผ่านและการจัดวิชาเลือกทั้งหมด?",
    confirm_yes: "ตกลง",
    confirm_no: "ยกเลิก",
    theme_light: "เปลี่ยนเป็นโหมดสว่าง",
    theme_dark: "เปลี่ยนเป็นโหมดมืด",
    
    year: "ชั้นปีที่",
    semester: "ภาคการศึกษาที่",
    
    // Tracks
    track_core: "วิชาแกนและวิชาบังคับ",
    track_programmer: "สายโปรแกรมเมอร์ (Programmer Track)",
    track_artist: "สายอาร์ตติส (Artist Track)",
    track_designer: "สายดีไซเนอร์ (Designer Track)",
    track_misc: "วิชาศึกษาทั่วไปและเสียง (Misc & GE & Sound)",
    
    // Course Detail Modal
    course_overview: "ข้อมูลรายวิชาและคำอธิบายรายวิชา",
    lecture_hours: "บรรยาย (ชั่วโมง)",
    lab_practice: "ปฏิบัติการ (ชั่วโมง)",
    self_study: "ศึกษาด้วยตนเอง",
    learning_prep_tips: "คำแนะนำการเตรียมตัวเรียนและการให้คำปรึกษา",
    recommended_software: "ซอฟต์แวร์แนะนำที่ควรติดตั้ง:",
    key_skills_concepts: "ทักษะและแนวคิดสำคัญที่จะได้เรียนรู้:",
    no_software_needed: "ไม่จำเป็นต้องติดตั้งโปรแกรมเพิ่มเติม (ใช้เครื่องมือมาตรฐานทั่วไปหรือบราวเซอร์)",
    foundational_skills: "ทักษะพื้นฐานความรู้ทางวิชาการ",
    keywords: "คำสำคัญ (Keywords):",
    no_description: "ไม่มีข้อมูลคำอธิบายรายวิชาในระบบทะเบียนหลักสูตร มช. รายวิชานี้เน้นพัฒนาสมรรถนะพื้นฐานของวิชาเอกดิจิทัลเกมส์",
    major_elec_status: "สถานะการจัดสรรวิชาเอกเลือก:",
    assigned: "วิชาที่จัดไว้:",
    change_course: "เปลี่ยนรายวิชา",
    remove_assignment: "ล้างการเลือก",
    no_major_assigned: "ยังไม่ได้ลงเรียนวิชาเอกเลือกในช่องนี้",
    browse_assign_course: "เปิดคลังและจัดรายวิชา",
    
    course_completed: "เรียนผ่านรายวิชานี้แล้ว",
    course_completed_desc: "คุณเรียนผ่านวิชานี้แล้วและทำตามเงื่อนไขข้อกำหนดหลักสูตรสำเร็จ",
    eligible_to_enroll: "ปลดล็อกแล้ว (พร้อมลงทะเบียน)",
    eligible_to_enroll_desc: "วิชาบังคับก่อนครบถ้วน คุณสามารถจัดสรรรายวิชานี้ในแผนการศึกษาได้",
    prereqs_locked: "รายวิชาบังคับก่อนยังล็อกอยู่",
    prereqs_locked_desc: "คุณต้องเรียนวิชาบังคับก่อนที่จำเป็นให้ครบถ้วนก่อนลงเรียนวิชานี้ วิชาที่ยังไม่ผ่าน:",
    at_least_one_of: "วิชาใดวิชาหนึ่งใน",
    all_of: "ทุกวิชาใน"
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('cmu_dg_app_lang');
    return saved === 'th' || saved === 'en' ? saved : 'en';
  });

  const setLanguage = (lang) => {
    if (lang === 'th' || lang === 'en') {
      setLanguageState(lang);
      localStorage.setItem('cmu_dg_app_lang', lang);
    }
  };

  const t = (key, interpolations = {}) => {
    const dict = resources[language] || resources['en'];
    let val = dict[key] || resources['en'][key] || key;
    
    // Replace double curly braces interpolations e.g. {{track}}
    Object.entries(interpolations).forEach(([k, v]) => {
      val = val.replace(`{{${k}}}`, v);
    });
    
    return val;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
