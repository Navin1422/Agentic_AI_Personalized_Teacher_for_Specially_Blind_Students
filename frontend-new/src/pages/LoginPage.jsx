import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import voiceAssistant from '../services/voiceAssistant';
import '../styles/index.css';



const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [role, setRole] = useState(location.state?.role || 'student');

    const [email, setEmail] = useState('');

    const [password, setPassword] = useState('');

    const [isListening, setIsListening] = useState(false);

    const [status, setStatus] = useState(`Logging in as ${role.toUpperCase()}...`);

    const [recognizedText, setRecognizedText] = useState('');

    const [studentData, setStudentData] = useState({
        name: '',
        class: '',
        school: '',
        availableClasses: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
    });

    // Tracks which field is currently being confirmed ('email' | 'password')
    const [confirmingType, setConfirmingType] = useState('email');

    const flowStarted = useRef(false);




    useEffect(() => {

        // Get role from location state or default to student

        const currentRole = location.state?.role || role;

        setRole(currentRole);

        

        console.log('LoginPage - Role:', currentRole);

        console.log('LoginPage - Location state:', location.state);

        

        if (!flowStarted.current) {

            console.log(`Starting ${currentRole} voice login...`);

            if (currentRole === 'student') {

                startStudentVoiceLogin();

            } else if (currentRole === 'teacher') {

                startTeacherVoiceLogin();

            } else if (currentRole === 'admin') {

                startAdminVoiceLogin();

            }

            flowStarted.current = true;

        }

    }, [location.state, role]);



    const startStudentVoiceLogin = () => {

        console.log('startStudentVoiceLogin called');

        // Small delay to ensure page is fully loaded and voice assistant is ready

        setTimeout(() => {

            collectStudentInfo();

        }, 1000);

    };



    const startTeacherVoiceLogin = () => {

        console.log('startTeacherVoiceLogin called');

        setTimeout(() => {

            collectTeacherInfo();

        }, 1000);

    };



    const startAdminVoiceLogin = () => {

        console.log('startAdminVoiceLogin called');

        setTimeout(() => {

            collectAdminInfo();

        }, 1000);

    };



    const collectTeacherInfo = () => {

        console.log('collectTeacherInfo called');

        setStatus('TEACHER LOGIN - VOICE ASSISTANT READY');

        

        setTimeout(() => {

            voiceAssistant.speak("Okay teacher! Let's get you logged in. Please tell me your full name.", async () => {

                setIsListening(true);

                try {

                    const nameResult = await voiceAssistant.listen(

                        (res) => {

                            console.log('Teacher name captured:', res);

                            setIsListening(false);

                            const cleanName = voiceAssistant.cleanName(res);

                            setStudentData(prev => ({ ...prev, name: cleanName }));

                            voiceAssistant.speak(`Thank you ${cleanName}! Now please tell me your email address.`, async () => {

                                collectTeacherEmail(cleanName);

                            });

                        },

                        (err) => {

                            console.error('Teacher name recognition error:', err);

                            setIsListening(false);

                            voiceAssistant.speak("I didn't hear your name clearly. Please say your name again.", () => collectTeacherInfo());

                        }

                    );

                } catch (error) {

                    console.error('Teacher name input failed:', error);

                    setIsListening(false);

                    voiceAssistant.speak("Name input failed. Please try again.", () => collectTeacherInfo());

                }

            });

        }, 500);

    };



    const collectAdminInfo = () => {

        console.log('collectAdminInfo called');

        setStatus('ADMIN LOGIN - VOICE ASSISTANT READY');

        

        setTimeout(() => {

            voiceAssistant.speak("Okay admin! Let's get you logged in. Please tell me your full name.", async () => {

                setIsListening(true);

                try {

                    const nameResult = await voiceAssistant.listen(

                        (res) => {

                            console.log('Admin name captured:', res);

                            setIsListening(false);

                            const cleanName = voiceAssistant.cleanName(res);

                            setStudentData(prev => ({ ...prev, name: cleanName }));

                            voiceAssistant.speak(`Thank you ${cleanName}! Now please tell me your email address.`, async () => {

                                collectAdminEmail(cleanName);

                            });

                        },

                        (err) => {

                            console.error('Admin name recognition error:', err);

                            setIsListening(false);

                            voiceAssistant.speak("I didn't hear your name clearly. Please say your name again.", () => collectAdminInfo());

                        }

                    );

                } catch (error) {

                    console.error('Admin name input failed:', error);

                    setIsListening(false);

                    voiceAssistant.speak("Name input failed. Please try again.", () => collectAdminInfo());

                }

            });

        }, 500);

    };



    const collectStudentInfo = () => {

        console.log('collectStudentInfo called');

        setStatus('STUDENT LOGIN - VOICE ASSISTANT READY');

        

        // Ensure voice assistant is ready

        setTimeout(() => {

            voiceAssistant.speak("Okay student! Let's get you logged in. First, please tell me your full name.", async () => {

                setIsListening(true);

                try {

                    const nameResult = await voiceAssistant.listen(

                        (res) => {

                            console.log('Name captured:', res);

                            setIsListening(false);

                            const cleanName = voiceAssistant.cleanName(res);

                            setStudentData(prev => ({ ...prev, name: cleanName }));

                            voiceAssistant.speak(`Thank you ${cleanName}! Now please tell me your class. You can say any class from Class 1 to Class 12.`, async () => {

                                setIsListening(true);

                                collectClassInfo(cleanName);

                            });

                        },

                        (err) => {

                            console.error('Name recognition error:', err);

                            setIsListening(false);

                            voiceAssistant.speak("I didn't hear your name clearly. Please say your name again.", () => collectStudentInfo());

                        }

                    );

                } catch (error) {

                    console.error('Name input failed:', error);

                    setIsListening(false);

                    voiceAssistant.speak("Name input failed. Please try again.", () => collectStudentInfo());

                }

            });

        }, 500);

    };



    const collectClassInfo = async (studentName) => {

        setIsListening(true);

        try {

            const classResult = await voiceAssistant.listen(

                (res) => {

                    console.log('Class captured:', res);

                    setIsListening(false);

                    setStudentData(prev => ({ ...prev, class: res }));

                    voiceAssistant.speak(`Great! ${res}. Now please tell me your school name.`, async () => {

                        setIsListening(true);

                        collectSchoolInfo(studentName, res);

                    });

                },

                (err) => {

                    console.error('Class recognition error:', err);

                    setIsListening(false);

                    voiceAssistant.speak("I didn't hear your class clearly. Please say your class again.", () => collectClassInfo(studentName));

                }

            );

        } catch (error) {

            console.error('Class input failed:', error);

            setIsListening(false);

            voiceAssistant.speak("Class input failed. Please try again.", () => collectClassInfo(studentName));

        }

    };



    const collectSchoolInfo = async (studentName, studentClass) => {

        setIsListening(true);

        try {

            const schoolResult = await voiceAssistant.listen(

                (schoolInfo) => {

                    console.log('School captured:', schoolInfo);

                    setIsListening(false);

                    const cleanSchool = schoolInfo.trim();

                    setStudentData(prev => ({ ...prev, school: cleanSchool }));

                    voiceAssistant.speak("Now please say your email address.", async () => {

                        collectEmail(studentName, studentClass, cleanSchool);

                    });

                },

                (err) => {

                    console.error('School recognition error:', err);

                    setIsListening(false);

                    voiceAssistant.speak("I didn't hear your school name. Please try again.", () => collectSchoolInfo(studentName, studentClass));

                }

            );

            

            // Timeout handling

            setTimeout(() => {

                if (isListening) {

                    setIsListening(false);

                    voiceAssistant.speak("I didn't hear your school name. Please try again.", () => collectSchoolInfo(studentName, studentClass));

                }

            }, 8000);

            

        } catch (error) {

            console.error('School info collection failed:', error);

            setIsListening(false);

            voiceAssistant.speak("I didn't hear your school name. Please try again.", () => collectSchoolInfo(studentName, studentClass));

        }

    };



    const collectTeacherEmail = async (teacherName) => {

        setIsListening(true);

        setStatus('Listening for teacher email...');

        setRecognizedText('');

        try {

            const emailResult = await voiceAssistant.listen(

                (emailRes) => {

                    console.log('Teacher email captured:', emailRes);

                    setIsListening(false);

                    const cleanedEmail = voiceAssistant.cleanEmail(emailRes);

                    setRecognizedText(cleanedEmail);

                    setEmail(cleanedEmail);

                    setStatus('Email received! Now listening for password...');

                    

                    voiceAssistant.speak("Email received! Now please say your password.", async () => {

                        collectTeacherPassword(teacherName, cleanedEmail);

                    });

                },

                (err) => {

                    console.error('Teacher email recognition error:', err);

                    setIsListening(false);

                    setStatus('Email not heard. Please try again.');

                    voiceAssistant.speak("I didn't hear your email. Please try again.", () => collectTeacherEmail(teacherName));

                }

            );

        } catch (error) {

            console.error('Teacher email input failed:', error);

            setIsListening(false);

            voiceAssistant.speak("Email input failed. Please try again.", () => collectTeacherEmail(teacherName));

        }

    };



    const collectAdminEmail = async (adminName) => {

        setIsListening(true);

        setStatus('Listening for admin email...');

        setRecognizedText('');

        try {

            const emailResult = await voiceAssistant.listen(

                (emailRes) => {

                    console.log('Admin email captured:', emailRes);

                    setIsListening(false);

                    const cleanedEmail = voiceAssistant.cleanEmail(emailRes);

                    setRecognizedText(cleanedEmail);

                    setEmail(cleanedEmail);

                    setStatus('Email received! Now listening for password...');

                    

                    voiceAssistant.speak("Email received! Now please say your password.", async () => {

                        collectAdminPassword(adminName, cleanedEmail);

                    });

                },

                (err) => {

                    console.error('Admin email recognition error:', err);

                    setIsListening(false);

                    setStatus('Email not heard. Please try again.');

                    voiceAssistant.speak("I didn't hear your email. Please try again.", () => collectAdminEmail(adminName));

                }

            );

        } catch (error) {

            console.error('Admin email input failed:', error);

            setIsListening(false);

            voiceAssistant.speak("Email input failed. Please try again.", () => collectAdminEmail(adminName));

        }

    };



    const collectEmail = async (studentName, studentClass, studentSchool) => {

        setIsListening(true);

        setStatus('Listening for your email address...');

        setRecognizedText('');

        try {

            const emailResult = await voiceAssistant.listen(

                (emailRes) => {

                    console.log('Email captured:', emailRes);

                    setIsListening(false);

                    const cleanedEmail = voiceAssistant.cleanEmail(emailRes);

                    setRecognizedText(cleanedEmail);

                    setEmail(cleanedEmail);

                    setStatus('Email received! Logging you in...');

                    

                    voiceAssistant.speak("Email received! Logging you in now.", () => {

                        handleVoiceLogin(studentName, studentClass, studentSchool, cleanedEmail, '');

                    });

                },

                (err) => {

                    console.error('Email recognition error:', err);

                    setIsListening(false);

                    setStatus('Email not heard. Please try again.');

                    voiceAssistant.speak("I didn't hear your email. Please try again.", () => collectEmail(studentName, studentClass, studentSchool));

                }

            );

            

            // Timeout handling

            setTimeout(() => {

                if (isListening) {

                    setIsListening(false);

                    voiceAssistant.speak("I didn't hear your email. Please try again.", () => collectEmail(studentName, studentClass, studentSchool));

                }

            }, 8000);

            

        } catch (error) {

            console.error('Email input failed:', error);

            setIsListening(false);

            voiceAssistant.speak("Email input failed. Please try again.", () => collectEmail(studentName, studentClass, studentSchool));

        }

    };



    const collectTeacherPassword = async (teacherName, confirmedEmail) => {

        setIsListening(true);

        setStatus('Listening for teacher password...');

        setRecognizedText('');

        try {

            const passResult = await voiceAssistant.listen(

                (passRes) => {

                    console.log('Teacher password captured:', passRes);

                    setIsListening(false);

                    setRecognizedText(passRes);

                    setPassword(passRes);

                    setStatus('Password received! Logging you in...');

                    

                    voiceAssistant.speak("Password received! Logging you in now.", () => {

                        handleVoiceLogin(teacherName, '', '', confirmedEmail, passRes);

                    });

                },

                (err) => {

                    console.error('Teacher password recognition error:', err);

                    setIsListening(false);

                    setStatus('Password not heard. Please try again.');

                    voiceAssistant.speak("I didn't hear your password. Please try again.", () => collectTeacherPassword(teacherName, confirmedEmail));

                }

            );

        } catch (error) {

            console.error('Teacher password input failed:', error);

            setIsListening(false);

            voiceAssistant.speak("Password input failed. Please try again.", () => collectTeacherPassword(teacherName, confirmedEmail));

        }

    };



    const collectAdminPassword = async (adminName, confirmedEmail) => {

        setIsListening(true);

        setStatus('Listening for admin password...');

        setRecognizedText('');

        try {

            const passResult = await voiceAssistant.listen(

                (passRes) => {

                    console.log('Admin password captured:', passRes);

                    setIsListening(false);

                    setRecognizedText(passRes);

                    setPassword(passRes);

                    setStatus('Password received! Logging you in...');

                    

                    voiceAssistant.speak("Password received! Logging you in now.", () => {

                        handleVoiceLogin(adminName, '', '', confirmedEmail, passRes);

                    });

                },

                (err) => {

                    console.error('Admin password recognition error:', err);

                    setIsListening(false);

                    setStatus('Password not heard. Please try again.');

                    voiceAssistant.speak("I didn't hear your password. Please try again.", () => collectAdminPassword(adminName, confirmedEmail));

                }

            );

        } catch (error) {

            console.error('Admin password input failed:', error);

            setIsListening(false);

            voiceAssistant.speak("Password input failed. Please try again.", () => collectAdminPassword(adminName, confirmedEmail));

        }

    };



    const requestPassword = async (studentName, studentClass, studentSchool, confirmedEmail) => {

        setIsListening(true);

        setStatus('Listening for your password...');

        setRecognizedText('');

        try {

            const passResult = await voiceAssistant.listen(

                (passRes) => {

                    console.log('Password captured:', passRes);

                    setIsListening(false);

                    setRecognizedText(passRes); // Show password as plain text

                    setPassword(passRes);

                    setStatus('Password received! Logging you in...');

                    

                    // Directly continue to student dashboard

                    voiceAssistant.speak("Password received! Logging you in now.", () => {

                        handleVoiceLogin(studentName, studentClass, studentSchool, confirmedEmail, passRes);

                    });

                },

                (err) => {

                    console.error('Password recognition error:', err);

                    setIsListening(false);

                    setStatus('Password not heard. Please try again.');

                    voiceAssistant.speak("I didn't hear your password. Please try again.", () => requestPassword(studentName, studentClass, studentSchool, confirmedEmail));

                }

            );

            

            // Timeout handling

            setTimeout(() => {

                if (isListening) {

                    setIsListening(false);

                    voiceAssistant.speak("I didn't hear your password. Please try again.", () => requestPassword(studentName, studentClass, studentSchool, confirmedEmail));

                }

            }, 8000);

            

        } catch (error) {

            console.error('Password input failed:', error);

            setIsListening(false);

            voiceAssistant.speak("Password input failed. Please try again.", () => requestPassword(studentName, studentClass, studentSchool, confirmedEmail));

        }

    };



    const handleVoiceLogin = async (studentName, studentClass, studentSchool, email, password) => {
        setStatus('VALIDATING CREDENTIALS...');
        console.log('handleVoiceLogin called with:', { studentName, studentClass, studentSchool, email, role });
        
        // Prepare user data for authentication
        const userData = {
            name: studentName,
            class: studentClass,
            school: studentSchool,
            email: email,
            role: role
        };
        
        voiceAssistant.speak("Logging you in now.", async () => {
            try {
                // Perform login - this ensures token is stored and auth state is updated
                const loginResult = await login(userData, role);
                
                if (loginResult.success) {
                    console.log('Authentication successful, navigating to dashboard...');
                    
                    // Navigate only after authentication is complete
                    setTimeout(() => {
                        if (role === 'admin') {
                            console.log('Navigating to admin dashboard');
                            navigate('/admin', { 
                                state: { 
                                    adminData: {
                                        name: studentName,
                                        email: email
                                    }
                                } 
                            });
                        } else if (role === 'teacher') {
                            console.log('Navigating to teacher dashboard');
                            navigate('/teacher', { 
                                state: { 
                                    teacherData: {
                                        name: studentName,
                                        class: studentClass,
                                        school: studentSchool,
                                        email: email
                                    }
                                } 
                            });
                        } else {
                            // Default to student
                            console.log('Navigating to student dashboard with data:', { studentName, studentClass, studentSchool, email });
                            navigate('/student', { 
                                state: { 
                                    studentData: {
                                        name: studentName,
                                        class: studentClass,
                                        school: studentSchool,
                                        email: email
                                    }
                                } 
                            });
                        }
                    }, 500); // Small delay to ensure auth state is fully set
                } else {
                    console.error('Login failed:', loginResult.error);
                    setStatus('Login failed. Please try again.');
                    voiceAssistant.speak("Login failed. Please try again.", () => {
                        // Restart the login flow based on role
                        if (role === 'student') {
                            collectStudentInfo();
                        } else if (role === 'teacher') {
                            collectTeacherInfo();
                        } else if (role === 'admin') {
                            collectAdminInfo();
                        }
                    });
                }
            } catch (error) {
                console.error('Authentication error:', error);
                setStatus('Authentication error. Please try again.');
                voiceAssistant.speak("Authentication error. Please try again.", () => {
                    // Restart the login flow
                    if (role === 'student') {
                        collectStudentInfo();
                    } else if (role === 'teacher') {
                        collectTeacherInfo();
                    } else if (role === 'admin') {
                        collectAdminInfo();
                    }
                });
            }
        });
    };



    const handleManualLogin = async (e) => {
        e.preventDefault();
        
        // Prepare user data for authentication
        const userData = {
            name: email.split('@')[0], // Extract name from email
            email: email,
            role: role
        };
        
        try {
            // Perform login
            const loginResult = await login(userData, role);
            
            if (loginResult.success) {
                // Navigate based on role
                if (role === 'admin') {
                    navigate('/admin', { state: { adminData: { name: userData.name, email: email } } });
                } else if (role === 'teacher') {
                    navigate('/teacher', { state: { teacherData: { name: userData.name, email: email } } });
                } else {
                    navigate('/student', { state: { studentData: { name: userData.name, email: email } } });
                }
            } else {
                setStatus('Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Manual login error:', error);
            setStatus('Login error. Please try again.');
        }
    };



    return (

        <div className="dashboard-layout fade-in">

            <header className="header">

                <div>

                    <h1 style={{ fontSize: '2.5rem' }}>LOGIN PORTAL</h1>

                    <div className="status-badge">{status}</div>

                </div>

            </header>



            <main className="content-area">

                {/* Voice Collection Status */}

                <div className="card" style={{ marginBottom: '2rem' }}>

                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '4px solid black' }}>

                        🎤 VOICE LOGIN SYSTEM

                    </h2>

                    

                    {/* Student Information Display */}

                    <div style={{ marginBottom: '2rem' }}>

                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 800 }}>STUDENT INFORMATION</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

                            <div>

                                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Name:</p>

                                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{studentData.name || 'Listening...'}</p>

                            </div>

                            <div>

                                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Class:</p>

                                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{studentData.class || 'Listening...'}</p>

                            </div>

                            <div>

                                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>School:</p>

                                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{studentData.school || 'Listening...'}</p>

                            </div>

                            <div>

                                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Email:</p>

                                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{email || 'Listening...'}</p>

                            </div>

                        </div>

                    </div>



                    {/* Voice Status Indicator */}

                    <div style={{ textAlign: 'center', padding: '2rem', border: '3px dashed black', marginBottom: '2rem' }}>

                        <div className={`voice-orb ${isListening ? 'listening' : ''}`} style={{ margin: '0 auto 1rem' }}>

                            <span style={{ fontSize: '3rem' }}>{isListening ? '👂' : '🗣️'}</span>

                        </div>

                        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>

                            {isListening ? 'Listening for voice input...' : 'Voice assistant ready'}

                        </p>

                        

                        {/* Recognized Text Display */}

                        {recognizedText && (

                            <div style={{ 

                                marginTop: '1rem', 

                                padding: '1rem', 

                                backgroundColor: '#f8f9fa', 

                                border: '2px solid #007bff',

                                borderRadius: '8px',

                                textAlign: 'left'

                            }}>

                                <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: '0 0 0.5rem 0' }}>

                                    {confirmingType === 'email' || status.includes('email') ? '📧 Email received:' : '🔐 Password received:'}

                                </p>

                                <p style={{ 

                                    fontWeight: 600, 

                                    fontSize: '1.1rem', 

                                    margin: '0',

                                    wordBreak: 'break-all'

                                }}>

                                    {recognizedText}

                                </p>

                            </div>

                        )}

                    </div>

                </div>



                {/* Manual Login Fallback (for teachers/admins) */}

                {role !== 'student' && (

                    <div className="card">

                        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '4px solid black' }}>

                            ⌨️ MANUAL LOGIN

                        </h2>

                        <form onSubmit={handleManualLogin}>

                            <div style={{ marginBottom: '1rem' }}>

                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email:</label>

                                <input

                                    type="email"

                                    value={email}

                                    onChange={(e) => setEmail(e.target.value)}

                                    style={{ 

                                        width: '100%', 

                                        padding: '0.8rem', 

                                        border: '2px solid black', 

                                        fontSize: '1rem'

                                    }}

                                    placeholder="Enter your email"

                                    required

                                />

                            </div>

                            <div style={{ marginBottom: '1rem' }}>

                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Password:</label>

                                <input

                                    type="password"

                                    value={password}

                                    onChange={(e) => setPassword(e.target.value)}

                                    style={{ 

                                        width: '100%', 

                                        padding: '0.8rem', 

                                        border: '2px solid black', 

                                        fontSize: '1rem'

                                    }}

                                    placeholder="Enter your password"

                                    required

                                />

                            </div>

                            <button type="submit" style={{ width: '100%', fontSize: '1rem', padding: '1rem' }}>

                                LOGIN AS {role.toUpperCase()}

                            </button>

                        </form>

                    </div>

                )}

            </main>

        </div>

    );

};



export default LoginPage;

