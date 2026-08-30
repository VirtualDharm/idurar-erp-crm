import { lazy } from 'react';

import { Navigate } from 'react-router-dom';

const Logout = lazy(() => import('@/pages/Logout.jsx'));
const NotFound = lazy(() => import('@/pages/NotFound.jsx'));


const Customer = lazy(() => import('@/pages/Customer'));
const Invoice = lazy(() => import('@/pages/Invoice'));
const InvoiceCreate = lazy(() => import('@/pages/Invoice/InvoiceCreate'));

const InvoiceRead = lazy(() => import('@/pages/Invoice/InvoiceRead'));
const InvoiceUpdate = lazy(() => import('@/pages/Invoice/InvoiceUpdate'));
const InvoiceRecordPayment = lazy(() => import('@/pages/Invoice/InvoiceRecordPayment'));

const Payment = lazy(() => import('@/pages/Payment/index'));
const PaymentRead = lazy(() => import('@/pages/Payment/PaymentRead'));
const PaymentUpdate = lazy(() => import('@/pages/Payment/PaymentUpdate'));

const Settings = lazy(() => import('@/pages/Settings/Settings'));
const PaymentMode = lazy(() => import('@/pages/PaymentMode'));
const Taxes = lazy(() => import('@/pages/Taxes'));
const Team = lazy(() => import('@/pages/Team'));

// --- solar modules ---
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Lead = lazy(() => import('@/pages/Lead'));
const LeadRead = lazy(() => import('@/pages/Lead/LeadRead'));
const SurveyList = lazy(() => import('@/pages/Survey'));
const SurveyRead = lazy(() => import('@/pages/Survey/SurveyRead'));
const QuotationList = lazy(() => import('@/pages/Quotation'));
const QuotationForm = lazy(() => import('@/pages/Quotation/QuotationForm'));
const ProjectList = lazy(() => import('@/pages/Project'));
const ProjectRead = lazy(() => import('@/pages/Project/ProjectRead'));
const SubsidyTracker = lazy(() => import('@/pages/SubsidyTracker'));
const AfterSales = lazy(() => import('@/pages/AfterSales'));
const Product = lazy(() => import('@/pages/Product'));
const SubsidyRule = lazy(() => import('@/pages/SubsidyRule'));
const PaymentTemplate = lazy(() => import('@/pages/PaymentTemplate'));


const Profile = lazy(() => import('@/pages/Profile'));

const About = lazy(() => import('@/pages/About'));

let routes = {
  expense: [],
  default: [
    {
      path: '/login',
      element: <Navigate to="/" />,
    },
    {
      path: '/logout',
      element: <Logout />,
    },
    {
      path: '/about',
      element: <About />,
    },
    {
      path: '/',
      element: <Dashboard />,
    },
    { path: '/lead', element: <Lead /> },
    { path: '/lead/read/:id', element: <LeadRead /> },
    { path: '/survey', element: <SurveyList /> },
    { path: '/survey/read/:id', element: <SurveyRead /> },
    { path: '/quotation', element: <QuotationList /> },
    { path: '/quotation/create', element: <QuotationForm /> },
    { path: '/quotation/update/:id', element: <QuotationForm /> },
    { path: '/project', element: <ProjectList /> },
    { path: '/project/read/:id', element: <ProjectRead /> },
    { path: '/subsidy', element: <SubsidyTracker /> },
    { path: '/after-sales', element: <AfterSales /> },
    { path: '/product', element: <Product /> },
    { path: '/subsidy-rules', element: <SubsidyRule /> },
    { path: '/payment-templates', element: <PaymentTemplate /> },
    {
      path: '/customer',
      element: <Customer />,
    },

    {
      path: '/invoice',
      element: <Invoice />,
    },
    {
      path: '/invoice/create',
      element: <InvoiceCreate />,
    },
    {
      path: '/invoice/read/:id',
      element: <InvoiceRead />,
    },
    {
      path: '/invoice/update/:id',
      element: <InvoiceUpdate />,
    },
    {
      path: '/invoice/pay/:id',
      element: <InvoiceRecordPayment />,
    },
    {
      path: '/payment',
      element: <Payment />,
    },
    {
      path: '/payment/read/:id',
      element: <PaymentRead />,
    },
    {
      path: '/payment/update/:id',
      element: <PaymentUpdate />,
    },

    {
      path: '/settings',
      element: <Settings />,
    },
    {
      path: '/team',
      element: <Team />,
    },
    {
      path: '/settings/edit/:settingsKey',
      element: <Settings />,
    },
    {
      path: '/payment/mode',
      element: <PaymentMode />,
    },
    {
      path: '/taxes',
      element: <Taxes />,
    },

    {
      path: '/profile',
      element: <Profile />,
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ],
};

export default routes;
