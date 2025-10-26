import Dashboard from './pages/Dashboard';
import Leases from './pages/Leases';
import DepositTracker from './pages/DepositTracker';
import Documents from './pages/Documents';
import Cases from './pages/Cases';
import Profile from './pages/Profile';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Leases": Leases,
    "DepositTracker": DepositTracker,
    "Documents": Documents,
    "Cases": Cases,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};