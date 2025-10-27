import Dashboard from './pages/Dashboard';
import Leases from './pages/Leases';
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
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Leases": Leases,
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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};