// web/frontend/pages/customer.jsx - Customer points interface
import { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  Banner,
  Heading,
  TextField,
  Button,
  FormLayout,
} from '@shopify/polaris';
import CustomerPointsWidget from '../components/CustomerPointsWidget';
import SpinWheel from '../components/SpinWheel';

export default function CustomerPage() {
  const [customerId, setCustomerId] = useState('');
  const [shopDomain, setShopDomain] = useState('');
  const [showWidget, setShowWidget] = useState(false);

  // In a real implementation, these would come from:
  // - URL parameters
  // - Customer login session
  // - Shopify's customer context
  // For demo purposes, we'll allow manual entry

  const handleShowPoints = () => {
    if (customerId && shopDomain) {
      setShowWidget(true);
    }
  };

  return (
    <Page fullWidth title="My Loyalty Points">
      <Layout>
        <Layout.Section>
          <Banner title="Customer Loyalty Portal" status="info">
            <p>View your points balance, transaction history, and redeem rewards.</p>
          </Banner>
        </Layout.Section>

        {!showWidget ? (
          <Layout.Section>
            <Card sectioned>
              <Heading element="h2">Access Your Points</Heading>
              <br />
              <FormLayout>
                <TextField
                  label="Customer ID"
                  value={customerId}
                  onChange={setCustomerId}
                  placeholder="Enter your customer ID"
                  helpText="You can find this in your account settings or order emails"
                />
                <TextField
                  label="Shop Domain"
                  value={shopDomain}
                  onChange={setShopDomain}
                  placeholder="e.g., your-shop.myshopify.com"
                  helpText="The domain of the store where you shop"
                />
                <Button 
                  primary 
                  onClick={handleShowPoints}
                  disabled={!customerId || !shopDomain}
                >
                  View My Points
                </Button>
              </FormLayout>
            </Card>
          </Layout.Section>
        ) : (
          <>
            <Layout.Section>
                <CustomerPointsWidget 
                customerId={customerId} 
                shopDomain={shopDomain} 
                />
            </Layout.Section>

            <Layout.Section>
                <SpinWheel 
                customerId={customerId} 
                shopDomain={shopDomain} 
                />
            </Layout.Section>

            <Layout.Section>
                <Card sectioned>
                <Button onClick={() => setShowWidget(false)}>
                    Enter Different Customer ID
                </Button>
                </Card>
            </Layout.Section>
        </>

      )}

        <Layout.Section>
          <Card sectioned>
            <Heading element="h3">How Our Loyalty Program Works</Heading>
            <br />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <Heading element="h4">Earn Points</Heading>
                <p>Get 50 points for every order you place. Points are automatically added to your account when your order is confirmed.</p>
              </div>
              <div>
                <Heading element="h4">Redeem Rewards</Heading>
                <p>Use your points to get discount codes. 1 point = ₹1 value. Minimum redemption is 1 point.</p>
              </div>
              <div>
                <Heading element="h4">Track Progress</Heading>
                <p>View your complete points history, including earnings and redemptions. See how much you've saved!</p>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}