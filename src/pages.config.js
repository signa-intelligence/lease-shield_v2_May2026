/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Account from './pages/Account';
import Acknowledge from './pages/Acknowledge';
import AcknowledgeMaintenance from './pages/AcknowledgeMaintenance';
import AdminConsole from './pages/AdminConsole';
import AdminCredits from './pages/AdminCredits';
import AdminTemplates from './pages/AdminTemplates';
import Analytics from './pages/Analytics';
import CaseDetails from './pages/CaseDetails';
import Cases from './pages/Cases';
import CookieSync from './pages/CookieSync';
import DepositTracker from './pages/DepositTracker';
import DocumentVault from './pages/DocumentVault';
import Documents from './pages/Documents';
import EvidenceVault from './pages/EvidenceVault';
import FAQ from './pages/FAQ';
import Home from './pages/Home';
import Index from './pages/Index';
import LeaseLetters from './pages/LeaseLetters';
import LeaseViewer from './pages/LeaseViewer';
import Leases from './pages/Leases';
import LetterReview from './pages/LetterReview';
import LisaAnalytics from './pages/LisaAnalytics';
import MaintenanceTracker from './pages/MaintenanceTracker';
import OpsConsole from './pages/OpsConsole';
import PaymentSuccess from './pages/PaymentSuccess';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import RecycleBin from './pages/RecycleBin';
import RefundPolicy from './pages/RefundPolicy';
import ReportFull from './pages/ReportFull';
import ResolveCase from './pages/ResolveCase';
import RevenueAnalytics from './pages/RevenueAnalytics';
import RiskFeedbackAdmin from './pages/RiskFeedbackAdmin';
import ScanPreview from './pages/ScanPreview';
import Search from './pages/Search';
import Templates from './pages/Templates';
import Welcome from './pages/Welcome';
import cookieSync from './pages/cookie-sync';
import LeaseDetails from './pages/LeaseDetails';
import Timeline from './pages/Timeline';
import PropertyTracker from './pages/PropertyTracker';
import Dashboard from './pages/Dashboard';
import UploadScan from './pages/UploadScan';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Account": Account,
    "Acknowledge": Acknowledge,
    "AcknowledgeMaintenance": AcknowledgeMaintenance,
    "AdminConsole": AdminConsole,
    "AdminCredits": AdminCredits,
    "AdminTemplates": AdminTemplates,
    "Analytics": Analytics,
    "CaseDetails": CaseDetails,
    "Cases": Cases,
    "CookieSync": CookieSync,
    "DepositTracker": DepositTracker,
    "DocumentVault": DocumentVault,
    "Documents": Documents,
    "EvidenceVault": EvidenceVault,
    "FAQ": FAQ,
    "Home": Home,
    "Index": Index,
    "LeaseLetters": LeaseLetters,
    "LeaseViewer": LeaseViewer,
    "Leases": Leases,
    "LetterReview": LetterReview,
    "LisaAnalytics": LisaAnalytics,
    "MaintenanceTracker": MaintenanceTracker,
    "OpsConsole": OpsConsole,
    "PaymentSuccess": PaymentSuccess,
    "PrivacyPolicy": PrivacyPolicy,
    "Profile": Profile,
    "RecycleBin": RecycleBin,
    "RefundPolicy": RefundPolicy,
    "ReportFull": ReportFull,
    "ResolveCase": ResolveCase,
    "RevenueAnalytics": RevenueAnalytics,
    "RiskFeedbackAdmin": RiskFeedbackAdmin,
    "ScanPreview": ScanPreview,
    "Search": Search,
    "Templates": Templates,
    "Welcome": Welcome,
    "cookie-sync": cookieSync,
    "LeaseDetails": LeaseDetails,
    "Timeline": Timeline,
    "PropertyTracker": PropertyTracker,
    "Dashboard": Dashboard,
    "UploadScan": UploadScan,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};