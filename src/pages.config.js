import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import HowItWorks from './pages/HowItWorks';
import StartFreeTrial from './pages/StartFreeTrial';
import WebsiteIntakeForm from './pages/WebsiteIntakeForm';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "ClientDashboard": ClientDashboard,
    "Home": Home,
    "Pricing": Pricing,
    "HowItWorks": HowItWorks,
    "StartFreeTrial": StartFreeTrial,
    "WebsiteIntakeForm": WebsiteIntakeForm,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};