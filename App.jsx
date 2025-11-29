import React, { useState, useEffect } from 'react';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { MessageSquare, Calendar, BookOpen, Users } from 'lucide-react'; // Icons for the tabs

// -------------------------------------------------------------------------
// FIREBASE/AUTH SETUP (CRITICAL: DO NOT MODIFY THESE INITIALIZATIONS)
// The Canvas environment provides these global variables.
// -------------------------------------------------------------------------

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// The main App component
const App = () => {
  // 1. Firebase State
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Initializing application...");

  // 2. App State
  const [activeTab, setActiveTab] = useState('Chat'); // 'Chat', 'Schedule', 'Notes'
  const [userStatus, setUserStatus] = useState(null);

  // --- Initial Firebase Setup and Authentication ---
  useEffect(() => {
    // Check if firebase config is valid
    if (!firebaseConfig || !Object.keys(firebaseConfig).length) {
        setLoadingMessage("Firebase configuration missing. Cannot proceed with data storage.");
        return;
    }

    try {
        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firestoreAuth = getAuth(app);

        setDb(firestoreDb);
        setAuth(firestoreAuth);

        // Set up Auth State Listener
        const unsubscribe = onAuthStateChanged(firestoreAuth, async (user) => {
            if (user) {
                setUserId(user.uid);
                setUserStatus(`Logged in as: ${user.uid.substring(0, 8)}...`);
            } else {
                setUserId(null);
                setUserStatus("Authentication failed or not started.");
            }
            setIsAuthReady(true);
            setLoadingMessage(user ? "Authentication successful. Ready to load data." : "Authentication established.");
        });

        // Sign in using the provided token or anonymously
        const attemptSignIn = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(firestoreAuth, initialAuthToken);
                } else {
                    await signInAnonymously(firestoreAuth);
                }
            } catch (error) {
                console.error("Authentication error:", error);
                // Fallback to anonymous sign-in if custom token fails
                await signInAnonymously(firestoreAuth);
            }
        };

        attemptSignIn();
        return () => unsubscribe(); // Cleanup auth listener
    } catch (e) {
        setLoadingMessage(`Failed to initialize Firebase: ${e.message}`);
        console.error("Firebase Initialization Error:", e);
    }
  }, []);

  // --- Utility Functions for Firestore Paths ---
  const getPrivateCollectionRef = (collectionName) => {
    if (!db || !userId) return null;
    return collection(db, `artifacts/${appId}/users/${userId}/${collectionName}`);
  };
  
  // --- Loading State and UI ---
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-700 font-medium">{loadingMessage}</p>
          <p className="text-sm text-gray-500 mt-1">Authenticating user...</p>
        </div>
      </div>
    );
  }

  // --- Components for each Tab (Placeholder) ---
  const ChatView = () => (
    <div className="h-full flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl p-4">
      <p className="text-xl font-semibold">AI Chat Assistant (To be built in Step 7)</p>
    </div>
  );

  const ScheduleView = () => (
    <div className="h-full flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl p-4">
      <p className="text-xl font-semibold">Study Schedule/Reminders (To be built in Step 8)</p>
    </div>
  );

  const NotesView = () => (
    <div className="h-full flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl p-4">
      <p className="text-xl font-semibold">Quick Notes Storage (To be built in Step 9)</p>
    </div>
  );
  
  // --- Main Render Logic ---
  const renderContent = () => {
    switch (activeTab) {
      case 'Chat':
        // Pass db, userId, and auth to the component that needs it
        return <ChatView db={db} userId={userId} auth={auth} />;
      case 'Schedule':
        return <ScheduleView db={db} userId={userId} auth={auth} />;
      case 'Notes':
        return <NotesView db={db} userId={userId} auth={auth} />;
      default:
        return <ChatView db={db} userId={userId} auth={auth} />;
    }
  };

  // --- Tab Button Component ---
  const TabButton = ({ name, Icon }) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`
        flex items-center justify-center px-4 py-2 transition-all duration-200
        ${activeTab === name
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50'
          : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 bg-white'
        }
        rounded-xl
      `}
    >
      <Icon className="w-5 h-5 mr-2" />
      <span className="font-medium text-sm hidden sm:inline">{name}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-indigo-700 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-indigo-500" />
            AI Student Assistant
          </h1>
          <div className="flex space-x-2 bg-gray-50 p-1 rounded-xl shadow-inner">
            <TabButton name="Chat" Icon={MessageSquare} />
            <TabButton name="Schedule" Icon={Calendar} />
            <TabButton name="Notes" Icon={BookOpen} />
          </div>
          <p className="text-xs text-right text-gray-500 hidden sm:block">
            <span className="font-semibold text-indigo-500">User ID:</span> {userId ? userId : 'N/A'}
            <br />
            <span className="text-gray-400">{userStatus}</span>
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-xl h-[80vh]">
          {renderContent()}
        </div>
      </main>

      {/* Footer (Optional, for info) */}
      <footer className="w-full text-center p-3 text-sm text-gray-500 border-t border-gray-200">
        Hackathon Project {appId}
      </footer>
    </div>
  );
};

export default App;
