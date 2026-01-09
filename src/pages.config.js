import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import Pricing from './pages/Pricing';
import StartFreeTrial from './pages/StartFreeTrial';
import WebsiteIntakeForm from './pages/WebsiteIntakeForm';
import WebsiteEditor from './pages/WebsiteEditor';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "ClientDashboard": ClientDashboard,
    "Home": Home,
    "HowItWorks": HowItWorks,
    "Pricing": Pricing,
    "StartFreeTrial": StartFreeTrial,
    "WebsiteIntakeForm": WebsiteIntakeForm,
    "WebsiteEditor": WebsiteEditor,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};