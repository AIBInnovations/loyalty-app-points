// web/frontend/components/CustomerPointsWidget.jsx
import { useState, useEffect } from 'react';
import {
  Card,
  Badge,
  Button,
  Modal,
  FormLayout,
  TextField,
  Banner,
  Spinner,
  DataTable,
  EmptyState,
  Heading,
  TextContainer,
  Stack,
  DisplayText,
} from '@shopify/polaris';

const CustomerPointsWidget = ({ customerId, shopDomain }) => {
  const [customerData, setCustomerData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [redeemResult, setRedeemResult] = useState(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Fetch customer points data
  const fetchCustomerData = async () => {
    try {
      const response = await fetch(`/api/points/balance/${customerId}?shop=${shopDomain}`);
      const data = await response.json();
      
      if (response.ok) {
        setCustomerData(data);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transaction history
  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/points/transactions/${customerId}?shop=${shopDomain}&limit=10`);
      const data = await response.json();
      
      if (response.ok) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  useEffect(() => {
    if (customerId && shopDomain) {
      fetchCustomerData();
      fetchTransactions();
    }
  }, [customerId, shopDomain]);

  // Handle points redemption
  const handleRedeem = async () => {
    if (!pointsToRedeem || pointsToRedeem < 1) return;

    setIsRedeeming(true);
    try {
      const response = await fetch('/api/points/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          pointsToRedeem: parseInt(pointsToRedeem),
          shopDomain
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setRedeemResult(data);
        setPointsToRedeem('');
        fetchCustomerData(); // Refresh balance
        fetchTransactions(); // Refresh transactions
      } else {
        setRedeemResult({ error: data.error || 'Redemption failed' });
      }
    } catch (error) {
      setRedeemResult({ error: 'Network error. Please try again.' });
    } finally {
      setIsRedeeming(false);
    }
  };

  // Format transactions for table
  const transactionRows = transactions.map((tx) => [
    new Date(tx.createdAt).toLocaleDateString(),
    tx.description,
    <Badge status={tx.points > 0 ? 'success' : 'warning'} key={tx._id}>
      {tx.points > 0 ? '+' : ''}{tx.points}
    </Badge>,
    tx.balanceAfter.toLocaleString()
  ]);

  if (loading) {
    return (
      <Card sectioned>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner size="large" />
          <p>Loading your points...</p>
        </div>
      </Card>
    );
  }

  if (!customerData) {
    return (
      <Card sectioned>
        <EmptyState
          heading="Points not available"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Unable to load your points information.</p>
        </EmptyState>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Card.Section>
          <Stack distribution="equalSpacing" alignment="center">
            <Stack vertical spacing="tight">
              <Heading element="h2">Your Loyalty Points</Heading>
              <DisplayText size="large">
                {customerData.pointsBalance.toLocaleString()} points
              </DisplayText>
              <p>≈ ₹{customerData.pointsBalance.toLocaleString()} value</p>
            </Stack>
            
            <Stack vertical spacing="tight">
              <Button 
                primary 
                onClick={() => setShowRedeemModal(true)}
                disabled={customerData.pointsBalance < 1}
              >
                Redeem Points
              </Button>
              <Button onClick={() => setShowTransactionsModal(true)}>
                View History
              </Button>
            </Stack>
          </Stack>
        </Card.Section>

        <Card.Section>
          <Stack distribution="equalSpacing">
            <TextContainer>
              <p><strong>Total Earned:</strong> {customerData.totalPointsEarned.toLocaleString()} points</p>
              <p><strong>Total Orders:</strong> {customerData.totalOrders}</p>
            </TextContainer>
            <TextContainer>
              <p><strong>Total Redeemed:</strong> {customerData.totalPointsRedeemed.toLocaleString()} points</p>
              <p><strong>Points per Order:</strong> 50 points</p>
            </TextContainer>
          </Stack>
        </Card.Section>

        {customerData.isNew && (
          <Card.Section>
            <Banner status="info">
              <p>Welcome to our loyalty program! You'll earn 50 points for every order you place.</p>
            </Banner>
          </Card.Section>
        )}
      </Card>

      {/* Redeem Points Modal */}
      <Modal
        open={showRedeemModal}
        onClose={() => {
          setShowRedeemModal(false);
          setRedeemResult(null);
        }}
        title="Redeem Your Points"
        primaryAction={{
          content: isRedeeming ? 'Processing...' : 'Redeem Points',
          onAction: handleRedeem,
          disabled: !pointsToRedeem || pointsToRedeem < 1 || isRedeeming,
          loading: isRedeeming
        }}
        secondaryActions={[{
          content: 'Cancel',
          onAction: () => {
            setShowRedeemModal(false);
            setRedeemResult(null);
          }
        }]}
      >
        <Modal.Section>
          {redeemResult && (
            <Banner status={redeemResult.error ? 'critical' : 'success'}>
              {redeemResult.error || redeemResult.message}
              {redeemResult.discountCode && (
                <p><strong>Your discount code:</strong> {redeemResult.discountCode}</p>
              )}
            </Banner>
          )}

          <FormLayout>
            <TextField
              label="Points to Redeem"
              type="number"
              value={pointsToRedeem}
              onChange={setPointsToRedeem}
              placeholder="Enter points amount"
              min="1"
              max={customerData.pointsBalance}
              helpText={`You have ${customerData.pointsBalance} points available (₹${customerData.pointsBalance} value)`}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Transaction History Modal */}
      <Modal
        large
        open={showTransactionsModal}
        onClose={() => setShowTransactionsModal(false)}
        title="Points History"
        secondaryActions={[{
          content: 'Close',
          onAction: () => setShowTransactionsModal(false)
        }]}
      >
        <Modal.Section>
          {transactions.length > 0 ? (
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'numeric']}
              headings={['Date', 'Description', 'Points', 'Balance After']}
              rows={transactionRows}
            />
          ) : (
            <EmptyState
              heading="No transactions yet"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Your points transactions will appear here.</p>
            </EmptyState>
          )}
        </Modal.Section>
      </Modal>
    </>
  );
};

export default CustomerPointsWidget;