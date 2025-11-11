import Dashboard from './pages/Dashboard';
import DepositTracker from './pages/DepositTracker';
import Documents from './pages/Documents';
import Cases from './pages/Cases';
import Profile from './pages/Profile';
import Welcome from './pages/Welcome';
import UploadScan from './pages/UploadScan';
import ScanPreview from './pages/ScanPreview';
import ReportFull from './pages/ReportFull';
import DocumentVault from './pages/DocumentVault';
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
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';
import NewConversation from './pages/NewConversation';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "DepositTracker": DepositTracker,
    "Documents": Documents,
    "Cases": Cases,
    "Profile": Profile,
    "Welcome": Welcome,
    "UploadScan": UploadScan,
    "ScanPreview": ScanPreview,
    "ReportFull": ReportFull,
    "DocumentVault": DocumentVault,
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
    "Messages": Messages,
    "Conversation": Conversation,
    "NewConversation": NewConversation,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};