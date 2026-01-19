import Account from './pages/Account';
import Acknowledge from './pages/Acknowledge';
import AcknowledgeMaintenance from './pages/AcknowledgeMaintenance';
import AdminCanonicalLedger from './pages/AdminCanonicalLedger';
import AdminConsole from './pages/AdminConsole';
import AdminCredits from './pages/AdminCredits';
import AdminSupport from './pages/AdminSupport';
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
import LeaseDetails from './pages/LeaseDetails';
import LeaseLetters from './pages/LeaseLetters';
import LeaseViewer from './pages/LeaseViewer';
import Leases from './pages/Leases';
import LetterReview from './pages/LetterReview';
import MaintenanceTracker from './pages/MaintenanceTracker';
import OpsConsole from './pages/OpsConsole';
import PaymentSuccess from './pages/PaymentSuccess';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import PropertyTracker from './pages/PropertyTracker';
import RecycleBin from './pages/RecycleBin';
import RefundPolicy from './pages/RefundPolicy';
import ReportFull from './pages/ReportFull';
import ResolveCase from './pages/ResolveCase';
import RevenueAnalytics from './pages/RevenueAnalytics';
import RiskFeedbackAdmin from './pages/RiskFeedbackAdmin';
import ScanPreview from './pages/ScanPreview';
import Search from './pages/Search';
import Support from './pages/Support';
import Templates from './pages/Templates';
import Timeline from './pages/Timeline';
import UploadScan from './pages/UploadScan';
import Welcome from './pages/Welcome';
import cookieSync from './pages/cookie-sync';
import Dashboard from './pages/Dashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Account": Account,
    "Acknowledge": Acknowledge,
    "AcknowledgeMaintenance": AcknowledgeMaintenance,
    "AdminCanonicalLedger": AdminCanonicalLedger,
    "AdminConsole": AdminConsole,
    "AdminCredits": AdminCredits,
    "AdminSupport": AdminSupport,
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
    "LeaseDetails": LeaseDetails,
    "LeaseLetters": LeaseLetters,
    "LeaseViewer": LeaseViewer,
    "Leases": Leases,
    "LetterReview": LetterReview,
    "MaintenanceTracker": MaintenanceTracker,
    "OpsConsole": OpsConsole,
    "PaymentSuccess": PaymentSuccess,
    "PrivacyPolicy": PrivacyPolicy,
    "Profile": Profile,
    "PropertyTracker": PropertyTracker,
    "RecycleBin": RecycleBin,
    "RefundPolicy": RefundPolicy,
    "ReportFull": ReportFull,
    "ResolveCase": ResolveCase,
    "RevenueAnalytics": RevenueAnalytics,
    "RiskFeedbackAdmin": RiskFeedbackAdmin,
    "ScanPreview": ScanPreview,
    "Search": Search,
    "Support": Support,
    "Templates": Templates,
    "Timeline": Timeline,
    "UploadScan": UploadScan,
    "Welcome": Welcome,
    "cookie-sync": cookieSync,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};