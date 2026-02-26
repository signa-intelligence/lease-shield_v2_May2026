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
import Templates from './pages/Templates';
import RiskFeedbackAdmin from './pages/RiskFeedbackAdmin';
import RefundPolicy from './pages/RefundPolicy';
import FAQ from './pages/FAQ';
import Welcome from './pages/Welcome';
import EvidenceVault from './pages/EvidenceVault';
import LeaseViewer from './pages/LeaseViewer';
import AdminReferrals from './pages/AdminReferrals';
import UploadScan from './pages/UploadScan';
import LisaAnalytics from './pages/LisaAnalytics';
import AdminTemplates from './pages/AdminTemplates';
import Cases from './pages/Cases';
import ScanPreview from './pages/ScanPreview';
import Account from './pages/Account';
import LeaseDetails from './pages/LeaseDetails';
import LetterReview from './pages/LetterReview';
import PropertyTracker from './pages/PropertyTracker';
import Profile from './pages/Profile';
import DepositTracker from './pages/DepositTracker';
import RevenueAnalytics from './pages/RevenueAnalytics';
import AcknowledgeMaintenance from './pages/AcknowledgeMaintenance';
import AdminConsole from './pages/AdminConsole';
import Documents from './pages/Documents';
import Leases from './pages/Leases';
import CaseDetails from './pages/CaseDetails';
import LeaseLetters from './pages/LeaseLetters';
import Analytics from './pages/Analytics';
import Timeline from './pages/Timeline';
import DocumentVault from './pages/DocumentVault';
import Acknowledge from './pages/Acknowledge';
import RecycleBin from './pages/RecycleBin';
import cookieSync from './pages/cookie-sync';
import PaymentSuccess from './pages/PaymentSuccess';
import CookieSync from './pages/CookieSync';
import ResolveCase from './pages/ResolveCase';
import OpsConsole from './pages/OpsConsole';
import MaintenanceTracker from './pages/MaintenanceTracker';
import Search from './pages/Search';
import Dashboard from './pages/Dashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Home from './pages/Home';
import Index from './pages/Index';
import AdminCredits from './pages/AdminCredits';
import ReportFull from './pages/ReportFull';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Templates": Templates,
    "RiskFeedbackAdmin": RiskFeedbackAdmin,
    "RefundPolicy": RefundPolicy,
    "FAQ": FAQ,
    "Welcome": Welcome,
    "EvidenceVault": EvidenceVault,
    "LeaseViewer": LeaseViewer,
    "AdminReferrals": AdminReferrals,
    "UploadScan": UploadScan,
    "LisaAnalytics": LisaAnalytics,
    "AdminTemplates": AdminTemplates,
    "Cases": Cases,
    "ScanPreview": ScanPreview,
    "Account": Account,
    "LeaseDetails": LeaseDetails,
    "LetterReview": LetterReview,
    "PropertyTracker": PropertyTracker,
    "Profile": Profile,
    "DepositTracker": DepositTracker,
    "RevenueAnalytics": RevenueAnalytics,
    "AcknowledgeMaintenance": AcknowledgeMaintenance,
    "AdminConsole": AdminConsole,
    "Documents": Documents,
    "Leases": Leases,
    "CaseDetails": CaseDetails,
    "LeaseLetters": LeaseLetters,
    "Analytics": Analytics,
    "Timeline": Timeline,
    "DocumentVault": DocumentVault,
    "Acknowledge": Acknowledge,
    "RecycleBin": RecycleBin,
    "cookie-sync": cookieSync,
    "PaymentSuccess": PaymentSuccess,
    "CookieSync": CookieSync,
    "ResolveCase": ResolveCase,
    "OpsConsole": OpsConsole,
    "MaintenanceTracker": MaintenanceTracker,
    "Search": Search,
    "Dashboard": Dashboard,
    "PrivacyPolicy": PrivacyPolicy,
    "Home": Home,
    "Index": Index,
    "AdminCredits": AdminCredits,
    "ReportFull": ReportFull,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};