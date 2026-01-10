import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import Pricing from './pages/Pricing';
import StartFreeTrial from './pages/StartFreeTrial';
import WebsiteEditor from './pages/WebsiteEditor';
import WebsiteIntakeForm from './pages/WebsiteIntakeForm';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "ClientDashboard": ClientDashboard,
    "Home": Home,
    "HowItWorks": HowItWorks,
    "Pricing": Pricing,
    "StartFreeTrial": StartFreeTrial,
    "WebsiteEditor": WebsiteEditor,
    "WebsiteIntakeForm": WebsiteIntakeForm,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};