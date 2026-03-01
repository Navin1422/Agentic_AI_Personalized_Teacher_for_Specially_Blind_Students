import React, { useState } from 'react';
import '../styles/index.css';

const AdminDashboard = () => {
    const [status, setStatus] = useState('ADMIN CONSOLE: ONLINE');
    const [fileUploaded, setFileUploaded] = useState(false);
    const [adminData] = useState({
        name: 'Administrator',
        email: 'admin@eduvoice.com'
    });

    // Enhanced mock data with more student information
    const [students, setStudents] = useState([
        { 
            id: 'S001', 
            name: 'Alwin', 
            class: '10', 
            school: 'St. Mary\'s High School',
            teacher: 'Mrs. Sharma',
            progress: 'English Lesson 1: 80%, Science Lesson 2: 95%',
            lastActive: '2024-02-28 10:30 AM',
            assessments: 3,
            avgScore: 87.5
        },
        { 
            id: 'S002', 
            name: 'John Doe', 
            class: '12', 
            school: 'St. Mary\'s High School',
            teacher: 'Mr. Kumar',
            progress: 'History Lesson 1: 60%, Math Lesson 3: 45%',
            lastActive: '2024-02-28 09:15 AM',
            assessments: 5,
            avgScore: 52.5
        },
        { 
            id: 'S003', 
            name: 'Jane Doe', 
            class: '10', 
            school: 'St. Mary\'s High School',
            teacher: 'Mrs. Sharma',
            progress: 'Science Lesson 1: 100%',
            lastActive: '2024-02-28 11:45 AM',
            assessments: 2,
            avgScore: 95.0
        }
    ]);

    const [uploadedBooks, setUploadedBooks] = useState([
        { id: 1, title: 'English Grammar Basics', subject: 'English', class: '10', uploadedBy: 'Admin', date: '2024-02-27' },
        { id: 2, title: 'Science Fundamentals', subject: 'Science', class: '10', uploadedBy: 'Admin', date: '2024-02-26' }
    ]);

    const [file, setFile] = useState(null);

    const handleBookUpload = () => {
        if (file) {
            const newBook = {
                id: uploadedBooks.length + 1,
                title: file.name.replace('.pdf', ''),
                subject: 'General',
                class: 'All',
                uploadedBy: adminData.name,
                date: new Date().toISOString().split('T')[0]
            };
            setUploadedBooks(prev => [...prev, newBook]);
            setFileUploaded(true);
            setFile(null);
            setStatus('BOOK UPLOADED SUCCESSFULLY! AI ENGINE UPDATED');
            setTimeout(() => setStatus('ADMIN CONSOLE: ONLINE'), 3000);
        }
    };

    const handleDeleteStudent = (studentId) => {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        setStatus('STUDENT RECORD REMOVED');
        setTimeout(() => setStatus('ADMIN CONSOLE: ONLINE'), 2000);
    };

    const handleDeleteBook = (bookId) => {
        setUploadedBooks(prev => prev.filter(b => b.id !== bookId));
        setStatus('BOOK REMOVED FROM AI ENGINE');
        setTimeout(() => setStatus('ADMIN CONSOLE: ONLINE'), 2000);
    };

    return (
        <div className="dashboard-layout fade-in">
            <header className="header" style={{ marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '3rem' }}>ADMIN CONSOLE</h1>
                    <div className="status-badge" style={{ marginTop: '0.5rem' }}>{status}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                        <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{adminData.name}</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>{adminData.email}</p>
                    </div>
                    <div className="profile-icon">A</div>
                </div>
            </header>

            <main className="content-area">
                {/* Book Upload Section */}
                <div className="card" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '4px solid black' }}>📚 BOOK UPLOAD SYSTEM</h2>
                    <p style={{ marginBottom: '1.5rem', fontWeight: '600' }}>Upload PDF books that the AI will use to teach students. These books are analyzed and converted into interactive lessons.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                        <div>
                            <div style={{ padding: '2rem', border: '3px dashed black', textAlign: 'center', marginBottom: '2rem' }}>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    style={{ border: 'none', background: 'transparent', width: 'auto', boxShadow: 'none' }}
                                />
                            </div>
                            <button onClick={handleBookUpload} style={{ width: '100%', fontSize: '1rem', padding: '1.5rem' }}>
                                PUBLISH TO AI ENGINE
                            </button>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 800 }}>UPLOADED BOOKS ({uploadedBooks.length})</h3>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {uploadedBooks.map(book => (
                                    <div key={book.id} style={{
                                        padding: '0.8rem',
                                        border: '2px solid black',
                                        marginBottom: '0.5rem',
                                        background: '#F9F9F9',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{book.title}</p>
                                            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{book.subject} - Class {book.class}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteBook(book.id)}
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#FF6B6B' }}
                                        >
                                            DELETE
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Student Management */}
                <div className="card" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '4px solid black' }}>👥 STUDENT MANAGEMENT</h2>
                    <p style={{ marginBottom: '1.5rem', fontWeight: '600' }}>Monitor and manage all student accounts, progress, and learning activities.</p>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ borderBottom: '4px solid black' }}>
                                    <th style={{ padding: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Student</th>
                                    <th style={{ padding: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Class</th>
                                    <th style={{ padding: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>School</th>
                                    <th style={{ padding: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Teacher</th>
                                    <th style={{ padding: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Progress</th>
                                    <th style={{ padding: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Last Active</th>
                                    <th style={{ padding: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id} style={{ borderBottom: '2px solid black' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{student.name}</p>
                                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>ID: {student.id}</p>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{student.class}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{student.school}</td>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{student.teacher}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{student.progress}</p>
                                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Avg: {student.avgScore}% ({student.assessments} tests)</p>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{student.lastActive}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <button 
                                                onClick={() => handleDeleteStudent(student.id)}
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#FF6B6B' }}
                                            >
                                                REMOVE
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Actions */}
                <div className="card">
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '4px solid black' }}>🔧 SYSTEM ADMINISTRATION</h2>
                    <p style={{ fontWeight: 600, marginBottom: '2rem' }}>Complete system control and monitoring tools.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                        <button style={{ padding: '2rem', fontSize: '1rem' }}>
                            📊 EXPORT STUDENT REPORTS
                        </button>
                        <button style={{ padding: '2rem', fontSize: '1rem' }}>
                            🤖 AUDIT AI SESSIONS
                        </button>
                        <button style={{ padding: '2rem', fontSize: '1rem' }}>
                            👨‍🏫 MANAGE TEACHERS
                        </button>
                        <button style={{ padding: '2rem', fontSize: '1rem' }}>
                            📈 SYSTEM ANALYTICS
                        </button>
                        <button style={{ padding: '2rem', fontSize: '1rem' }}>
                            🔒 SECURITY SETTINGS
                        </button>
                        <button style={{ padding: '2rem', fontSize: '1rem' }}>
                            💾 BACKUP DATA
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
