import LegalPageLayout from '../layout/LegalPageLayout';

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <p>
        This Privacy Policy describes how Arena collects, uses, and discloses your information.
      </p>

      <h2>Information We Collect</h2>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.</p>

      <h2>How We Use Information</h2>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nisi. Nulla quis sem at nibh elementum imperdiet.</p>

      <h2>Contact</h2>
      <p>If you have questions, email us at <a href="mailto:support@arena.com" className="text-blue-400">support@arena.com</a>.</p>
    </LegalPageLayout>
  );
}
