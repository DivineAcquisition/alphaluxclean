import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { BookingProvider } from '@/contexts/BookingContext';
import { TestModeBanner } from '@/components/admin/TestModeBanner';
import { DomainRedirect } from '@/components/DomainRedirect';
import { UTMTracker } from '@/components/UTMTracker';

// Essential booking pages only
import { DomainAwareHome } from '@/components/DomainAwareHome';
import { Landing } from '@/views/Landing';

// Lazy load booking flow pages
const BookZip = lazy(() => import('@/views/book/Zip'));
const BookSquareFeet = lazy(() => import('@/views/book/SquareFeet'));
const BookOffer = lazy(() => import('@/views/book/Offer'));
const BookCheckout = lazy(() => import('@/views/book/Checkout'));
const BookDetails = lazy(() => import('@/views/book/Details'));
const BookConfirmation = lazy(() => import('@/views/book/Confirmation'));
const BookSuccess = lazy(() => import('@/views/book/Success')); // Keep for old bookings
import OrderStatus from '@/views/OrderStatus';
import OrderConfirmation from '@/views/OrderConfirmation';
import ConfirmationPreview from '@/views/ConfirmationPreview';
import PaymentSuccess from '@/views/PaymentSuccess';
import { WebhookTest } from '@/views/WebhookTest';
import AdminLogin from '@/views/AdminLogin';
import AdminOTPLogin from '@/views/AdminOTPLogin';
import AdminAuthLogin from '@/views/AdminAuthLogin';
import AdminStatus from '@/views/AdminStatus';
import AdminEmailTemplates from '@/views/AdminEmailTemplates';
import AdminEmailLogs from '@/views/AdminEmailLogs';
import AdminEmailEvents from '@/views/AdminEmailEvents';
import AdminUsers from '@/views/AdminUsers';
import AdminDashboard from '@/views/AdminDashboard';
import { AdminRoute } from '@/components/AdminRoute';
import { ReferralLanding } from '@/views/ReferralLanding';
import { Referrals } from '@/views/Referrals';
import GetReferral from '@/views/GetReferral';
import LearnMore from '@/views/LearnMore';
import RecurringServices from '@/views/RecurringServices';
import StartRecurring from '@/views/StartRecurring';
import Pricing from '@/views/Pricing';
import Careers from '@/views/Careers';

// Dev Test Pages
import { DevTest } from '@/views/DevTest';
import { DevTestScenarios } from '@/views/DevTestScenarios';
import { DevTestDatabase } from '@/views/DevTestDatabase';
import { DevTestPayments } from '@/views/DevTestPayments';
import { DevTestWebhooks } from '@/views/DevTestWebhooks';
import DevTestModeToggle from '@/views/DevTestModeToggle';
import BookingDebug from '@/views/BookingDebug';
import EmailTools from '@/views/EmailTools';
import HousecallProSettings from '@/views/admin/HousecallProSettings';
import HousecallProLogs from '@/views/admin/HousecallProLogs';
import HCPTestSuite from '@/views/admin/HCPTestSuite';
import PromoCodes from '@/views/admin/PromoCodes';
import BookingMonitor from '@/views/admin/BookingMonitor';
import BookingTester from '@/views/admin/BookingTester';
import DatabaseWatcher from '@/views/admin/DatabaseWatcher';
import ConversionOptimization from '@/views/admin/ConversionOptimization';
import Waitlist from '@/views/Waitlist';
import CallPage from '@/views/CallPage';

import NotFound from '@/views/NotFound';
import React from 'react';

const queryClient = new QueryClient();

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BookingProvider>
          <Router>
          <DomainRedirect>
            <UTMTracker />
            <TestModeBanner />
          <Routes>
            {/* Optimized Booking Flow */}
            <Route path="/book" element={<Suspense fallback={<div>Loading...</div>}><BookZip /></Suspense>} />
            <Route path="/book/zip" element={<Suspense fallback={<div>Loading...</div>}><BookZip /></Suspense>} />
            <Route path="/book/sqft" element={<Suspense fallback={<div>Loading...</div>}><BookSquareFeet /></Suspense>} />
            <Route path="/book/offer" element={<Suspense fallback={<div>Loading...</div>}><BookOffer /></Suspense>} />
            <Route path="/book/checkout" element={<Suspense fallback={<div>Loading...</div>}><BookCheckout /></Suspense>} />
            <Route path="/book/details" element={<Suspense fallback={<div>Loading...</div>}><BookDetails /></Suspense>} />
            <Route path="/book/confirmation" element={<Suspense fallback={<div>Loading...</div>}><BookConfirmation /></Suspense>} />
            
            {/* Redirects for old URLs */}
            <Route path="/book/home" element={<Navigate to="/book/sqft" replace />} />
            <Route path="/book/service" element={<Navigate to="/book/offer" replace />} />
            <Route path="/book/frequency" element={<Navigate to="/book/offer" replace />} />
            <Route path="/book/schedule" element={<Navigate to="/book/details" replace />} />
            <Route path="/book/summary" element={<Navigate to="/book/offer" replace />} />
              
              {/* Landing page with marketing content */}
              <Route path="/landing" element={<Landing />} />
              
              {/* Main booking route - redirect to booking flow */}
              <Route path="/" element={<Navigate to="/book/zip" replace />} />
            
            {/* Essential booking confirmation and status pages */}
            <Route path="/order-status" element={<OrderStatus />} />
            <Route path="/order-confirmation/:bookingId?" element={<OrderConfirmation />} />
            <Route path="/confirmation-preview" element={<ConfirmationPreview />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            
            {/* Webhook testing */}
            <Route path="/test-webhook" element={<WebhookTest />} />
            
            {/* Referral Routes */}
            <Route path="/ref/:code" element={<ReferralLanding />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/account/referrals" element={<Referrals />} />
            <Route path="/get-referral" element={<GetReferral />} />
            
            {/* Lead Capture */}
            <Route path="/learn-more" element={<LearnMore />} />
            
            {/* Call Page */}
            <Route path="/call" element={
              <Suspense fallback={<div>Loading...</div>}>
                {React.createElement(React.lazy(() => import('./views/CallPage')))}
              </Suspense>
            } />
            
            {/* Waitlist Page */}
            <Route path="/waitlist" element={<Waitlist />} />
            
            {/* Pricing Page */}
            <Route path="/pricing" element={<Pricing />} />
            
            {/* Careers / Hiring Page */}
            <Route path="/careers" element={<Careers />} />
            <Route path="/jobs" element={<Navigate to="/careers" replace />} />
            <Route path="/hiring" element={<Navigate to="/careers" replace />} />
            
            {/* Printable Pricing Sheet */}
            <Route path="/pricing-sheet" element={
              <Suspense fallback={<div>Loading...</div>}>
                {React.createElement(React.lazy(() => import('./views/PricingSheet')))}
              </Suspense>
            } />
            
            {/* Recurring Services */}
            <Route path="/recurring-services" element={<RecurringServices />} />
            <Route path="/start-recurring" element={<StartRecurring />} />
            
            {/* Admin Routes */}
            <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-otp-login" element={<AdminOTPLogin />} />
          <Route path="/admin-auth-login" element={<AdminAuthLogin />} />
          <Route path="/admin-status" element={<AdminStatus />} />
          <Route path="/admin/email/templates" element={<AdminEmailTemplates />} />
          <Route path="/admin/email/logs" element={<AdminEmailLogs />} />
          <Route path="/admin/email/events" element={<AdminEmailEvents />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/integrations/housecall-pro" element={<HousecallProSettings />} />
          <Route path="/admin/integrations/housecall-pro/logs" element={<HousecallProLogs />} />
          <Route path="/admin/integrations/housecall-pro/test" element={<HCPTestSuite />} />
          <Route path="/admin/promos" element={<PromoCodes />} />
          <Route path="/admin/csr-booking" element={
            <AdminRoute requiredRole="ops">
              <Suspense fallback={<div>Loading...</div>}>
                {React.createElement(React.lazy(() => import('./views/admin/CSRBookingForm')))}
              </Suspense>
            </AdminRoute>
          } />
          <Route path="/admin/booking-monitor" element={
            <AdminRoute>
              <BookingMonitor />
            </AdminRoute>
          } />
          <Route path="/admin/booking-tester" element={
            <AdminRoute>
              <BookingTester />
            </AdminRoute>
          } />
          <Route path="/admin/database-watcher" element={
            <AdminRoute>
              <DatabaseWatcher />
            </AdminRoute>
          } />
          <Route path="/admin/conversion" element={
            <AdminRoute>
              <ConversionOptimization />
            </AdminRoute>
          } />
          <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            
            {/* Payment Link Public Page */}
            <Route path="/pay/:bookingId" element={
              <Suspense fallback={<div>Loading...</div>}>
                {React.createElement(React.lazy(() => import('./views/PaymentLinkPage')))}
              </Suspense>
            } />
            
            {/* Dev Test Routes */}
            <Route path="/dev-test" element={<DevTest />} />
            <Route path="/dev-test/scenarios" element={<DevTestScenarios />} />
            <Route path="/dev-test/database" element={<DevTestDatabase />} />
            <Route path="/dev-test/payments" element={<DevTestPayments />} />
            <Route path="/dev-test/webhooks" element={<DevTestWebhooks />} />
            <Route path="/dev-test/test-mode" element={<DevTestModeToggle />} />
            <Route path="/dev-test/cleanup" element={
              <Suspense fallback={<div>Loading...</div>}>
                {React.createElement(React.lazy(() => import('./views/DevTestCleanup')))}
              </Suspense>
            } />
            <Route path="/demo-booking" element={
              <Suspense fallback={<div>Loading...</div>}>
                {React.createElement(React.lazy(() => import('./views/DemoBooking')))}
              </Suspense>
            } />
            <Route path="/booking-debug" element={<BookingDebug />} />
            <Route path="/email-tools" element={<EmailTools />} />
            
            {/* Health Endpoints for monitoring */}
            <Route path="/health/admin" element={<div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Admin OK</div>} />
            <Route path="/health/book" element={<div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Book OK</div>} />
            <Route path="/health/sub" element={<div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Sub OK</div>} />
            <Route path="/health/portal" element={<div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Portal OK</div>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
            </DomainRedirect>
        </Router>
        <Toaster />
        <Sonner />
        </BookingProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;