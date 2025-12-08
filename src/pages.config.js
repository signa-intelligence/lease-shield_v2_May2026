import Dashboard from './pages/Dashboard';
import DepositTracker from './pages/DepositTracker';
import Documents from './pages/Documents';
import Cases from './pages/Cases';
import Profile from './pages/Profile';
import UploadScan from './pages/UploadScan';
import ScanPreview from './pages/ScanPreview';
import ReportFull from './pages/ReportFull';
import Templates from './pages/Templates';
import TemplateForm from './pages/TemplateForm';
import ResolveCase from './pages/ResolveCase';
import Account from './pages/Account';
import AdminConsole from './pages/AdminConsole';
import PrivacyPolicy from './pages/PrivacyPolicy';
import MaintenanceTracker from './pages/MaintenanceTracker';
import Support from './pages/Support';
import LeaseDetails from './pages/LeaseDetails';
import CaseDetails from './pages/CaseDetails';
import OpsConsole from './pages/OpsConsole';
import AcknowledgeMaintenance from './pages/AcknowledgeMaintenance';
import Acknowledge from './pages/Acknowledge';
import PropertyTracker from './pages/PropertyTracker';
import Analytics from './pages/Analytics';
import Search from './pages/Search';
import Timeline from './pages/Timeline';
import EvidenceVault from './pages/EvidenceVault';
import RevenueAnalytics from './pages/RevenueAnalytics';
import AdminTemplates from './pages/AdminTemplates';
import RecycleBin from './pages/RecycleBin';
import FAQ from './pages/FAQ';
import LetterGenerator from './pages/LetterGenerator';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "DepositTracker": DepositTracker,
    "Documents": Documents,
    "Cases": Cases,
    "Profile": Profile,
    "UploadScan": UploadScan,
    "ScanPreview": ScanPreview,
    "ReportFull": ReportFull,
    "Templates": Templates,
    "TemplateForm": TemplateForm,
    "ResolveCase": ResolveCase,
    "Account": Account,
    "AdminConsole": AdminConsole,
    "PrivacyPolicy": PrivacyPolicy,
    "MaintenanceTracker": MaintenanceTracker,
    "Support": Support,
    "LeaseDetails": LeaseDetails,
    "CaseDetails": CaseDetails,
    "OpsConsole": OpsConsole,
    "AcknowledgeMaintenance": AcknowledgeMaintenance,
    "Acknowledge": Acknowledge,
    "PropertyTracker": PropertyTracker,
    "Analytics": Analytics,
    "Search": Search,
    "Timeline": Timeline,
    "EvidenceVault": EvidenceVault,
    "RevenueAnalytics": RevenueAnalytics,
    "AdminTemplates": AdminTemplates,
    "RecycleBin": RecycleBin,
    "FAQ": FAQ,
    "LetterGenerator": LetterGenerator,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};