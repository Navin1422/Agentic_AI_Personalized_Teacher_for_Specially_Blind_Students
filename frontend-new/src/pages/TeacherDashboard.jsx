import React, { useState } from 'react';
import '../styles/index.css';

const TeacherDashboard = () => {
    const [status, setStatus] = useState('TEACHER HUB: ONLINE');
    const [assessmentUploaded, setAssessmentUploaded] = useState(false);

    // Enhanced teacher data
    const teacherData = {
        name: 'Mrs. Sharma',
        school: 'St. Mary\'s High School',
        email: 'sharma@stmarys.edu',
        classes: ['Class 10', 'Class 12'],
        subjects: ['English', 'Science']
    };

    const [assessment, setAssessment] = useState(null);
    const [selectedClass, setSelectedClass] = useState('Class 10');
    const [selectedSubject, setSelectedSubject] = useState('English');
    const [assessmentTarget, setAssessmentTarget] = useState('class'); // 'class' or 'individual'
    const [targetStudent, setTargetStudent] = useState('');

    // Mock student data for teacher's classes
    const [students] = useState([
        { id: 'S001', name: 'Alwin', class: '10', email: 'alwin@stmarys.edu', progress: 87.5, lastAssessment: '2024-02-27' },
        { id: 'S002', name: 'Priya', class: '10', email: 'priya@stmarys.edu', progress: 92.0, lastAssessment: '2024-02-28' },
        { id: 'S003', name: 'Rahul', class: '12', email: 'rahul@stmarys.edu', progress: 78.5, lastAssessment: '2024-02-26' }
    ]);

    const [uploadedAssessments, setUploadedAssessments] = useState([
        { 
            id: 1, 
            title: 'English Grammar Quiz', 
            class: 'Class 10', 
            subject: 'English',
            target: 'class',
            date: '2024-02-27',
            completedBy: 2,
            avgScore: 85.5
        }
    ]);

    const handleUpload = () => {
        if (assessment) {
            const newAssessment = {
                id: uploadedAssessments.length + 1,
                title: assessment.name.replace('.pdf', ''),
                class: selectedClass,
                subject: selectedSubject,
                target: assessmentTarget,
                date: new Date().toISOString().split('T')[0],
                completedBy: 0,
                avgScore: 0
            };
            setUploadedAssessments(prev => [...prev, newAssessment]);
            setAssessmentUploaded(true);
            setAssessment(null);
            setStatus(`ASSESSMENT ASSIGNED TO ${assessmentTarget === 'class' ? selectedClass : targetStudent}!`);
            setTimeout(() => setStatus('TEACHER HUB: ONLINE'), 3000);
        }
    };

    const handleDeleteAssessment = (assessmentId) => {
        setUploadedAssessments(prev => prev.filter(a => a.id !== assessmentId));
        setStatus('ASSESSMENT REMOVED');
        setTimeout(() => setStatus('TEACHER HUB: ONLINE'), 2000);
    };

    const getStudentsForClass = (className) => {
        return students.filter(s => s.class === className.replace('Class ', ''));
    };

    return (
        <div className="dashboard-layout fade-in">
            <header className="header" style={{ marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '3rem' }}>TEACHER HUB</h1>
                    <div className="status-badge" style={{ marginTop: '0.5rem' }}>{status}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                        <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{teacherData.name}</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>{teacherData.school}</p>
                    </div>
                    <div className="profile-icon">T</div>
                </div>
            </header>

            <main className="content-area">
                <div className="card" style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>WELCOME BACK, PROF. {teacherData.name.toUpperCase()}</h2>
                        <p style={{ fontWeight: 600 }}>🏛️ ASSIGNED SCHOOL: {teacherData.school.toUpperCase()}</p>
                        <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>📧 {teacherData.email}</p>
                    </div>
                </div>

                {/* Enhanced Assessment Hub */}
                <div className="card" style={{ marginBottom: '3.5rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '4px solid black' }}>📤 ASSESSMENT HUB</h2>
                    <p style={{ marginBottom: '2rem', fontWeight: '600' }}>Create and assign assessments to your students. Assessments will be delivered via voice interface.</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                        <div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 800, display: 'block', marginBottom: '0.5rem' }}>SELECT CLASS:</label>
                                <select 
                                    value={selectedClass} 
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    style={{ width: '100%', padding: '1rem', border: '3px solid black', fontSize: '1rem' }}
                                >
                                    {teacherData.classes.map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 800, display: 'block', marginBottom: '0.5rem' }}>SELECT SUBJECT:</label>
                                <select 
                                    value={selectedSubject} 
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    style={{ width: '100%', padding: '1rem', border: '3px solid black', fontSize: '1rem' }}
                                >
                                    {teacherData.subjects.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 800, display: 'block', marginBottom: '0.5rem' }}>TARGET:</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button 
                                        onClick={() => setAssessmentTarget('class')}
                                        style={{ 
                                            flex: 1, 
                                            background: assessmentTarget === 'class' ? 'var(--accent-yellow)' : 'white',
                                            padding: '1rem'
                                        }}
                                    >
                                        ENTIRE CLASS
                                    </button>
                                    <button 
                                        onClick={() => setAssessmentTarget('individual')}
                                        style={{ 
                                            flex: 1, 
                                            background: assessmentTarget === 'individual' ? 'var(--accent-yellow)' : 'white',
                                            padding: '1rem'
                                        }}
                                    >
                                        INDIVIDUAL STUDENT
                                    </button>
                                </div>
                            </div>

                            {assessmentTarget === 'individual' && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ fontWeight: 800, display: 'block', marginBottom: '0.5rem' }}>SELECT STUDENT:</label>
                                    <select 
                                        value={targetStudent} 
                                        onChange={(e) => setTargetStudent(e.target.value)}
                                        style={{ width: '100%', padding: '1rem', border: '3px solid black', fontSize: '1rem' }}
                                    >
                                        <option value="">Choose a student...</option>
                                        {getStudentsForClass(selectedClass).map(student => (
                                            <option key={student.id} value={student.name}>
                                                {student.name} ({student.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ padding: '2rem', border: '3px dashed black', textAlign: 'center', marginBottom: '2rem' }}>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setAssessment(e.target.files[0])}
                                    style={{ border: 'none', background: 'transparent', width: 'auto', boxShadow: 'none' }}
                                />
                            </div>

                            <button 
                                onClick={handleUpload} 
                                disabled={!assessment || (assessmentTarget === 'individual' && !targetStudent)}
                                style={{ 
                                    width: '100%', 
                                    fontSize: '1rem', 
                                    padding: '1.5rem',
                                    opacity: (!assessment || (assessmentTarget === 'individual' && !targetStudent)) ? 0.5 : 1
                                }}
                            >
                                PUBLISH ASSESSMENT
                            </button>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 800 }}>UPLOADED ASSESSMENTS ({uploadedAssessments.length})</h3>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {uploadedAssessments.map(assessment => (
                                    <div key={assessment.id} style={{
                                        padding: '1rem',
                                        border: '2px solid black',
                                        marginBottom: '1rem',
                                        background: '#F9F9F9'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: 600, fontSize: '1rem' }}>{assessment.title}</p>
                                                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '0.5rem 0' }}>
                                                    {assessment.subject} - {assessment.class} ({assessment.target})
                                                </p>
                                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                                    📅 {assessment.date} | ✅ {assessment.completedBy} students | 📊 {assessment.avgScore}% avg
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteAssessment(assessment.id)}
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#FF6B6B', marginLeft: '1rem' }}
                                            >
                                                DELETE
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Student Progress Monitoring */}
                <div className="card" style={{ marginBottom: '3.5rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '4px solid black' }}>📈 STUDENT PROGRESS</h2>
                    <p style={{ marginBottom: '2rem', fontWeight: '600' }}>Monitor individual student performance and assessment results.</p>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '700px' }}>
                            <thead>
                                <tr style={{ borderBottom: '4px solid black' }}>
                                    <th style={{ padding: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Student</th>
                                    <th style={{ padding: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Class</th>
                                    <th style={{ padding: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Progress</th>
                                    <th style={{ padding: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Last Assessment</th>
                                    <th style={{ padding: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id} style={{ borderBottom: '2px solid black' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{student.name}</p>
                                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{student.email}</p>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>Class {student.class}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ 
                                                    width: '60px', 
                                                    height: '8px', 
                                                    background: '#E0E0E0', 
                                                    borderRadius: '4px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${student.progress}%`,
                                                        height: '100%',
                                                        background: student.progress >= 80 ? '#4CAF50' : student.progress >= 60 ? '#FF9800' : '#F44336'
                                                    }}></div>
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.progress}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{student.lastAssessment}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <button style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', marginRight: '0.5rem' }}>
                                                VIEW DETAILS
                                            </button>
                                            <button style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                                                SEND FEEDBACK
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Grading & Feedback */}
                <div className="card">
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '4px solid black' }}>🔧 GRADING & FEEDBACK</h2>
                    <p style={{ fontWeight: 600, marginBottom: '2.5rem' }}>Review assessment scores and provide voice feedback to students.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                        <button style={{ padding: '2rem', fontSize: '1rem' }}>
                            📊 REVIEW ALL SCORES
                        </button>
                        <button style={{ padding: '2rem', fontSize: '1rem' }}>
                            🎤 RECORD VOICE FEEDBACK
                        </button>
                        <button style={{ padding: '2rem', fontSize: '1rem' }}>
                            📤 EXPORT REPORTS
                        </button>
                        <button style={{ padding: '2rem', fontSize: '1rem' }}>
                            📈 CLASS ANALYTICS
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TeacherDashboard;
