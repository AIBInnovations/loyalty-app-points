// web/frontend/pages/index.jsx - Main Admin Dashboard
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Page,
  Layout,
  TextContainer,
  Heading,
  DisplayText,
  DataTable,
  Badge,
  Button,
  ButtonGroup,
  Spinner,
  Banner,
  Tabs,
  EmptyState,
  Pagination,
  TextField,
  Select,
  Modal,
  FormLayout,
} from "@shopify/polaris";
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import SpinWheelConfig from '../components/SpinWheelConfig';
import TransactionHistoryAdmin from '../components/TransactionHistoryAdmin';
import SimpleAnalytics from "../components/SimpleAnalytics";
import TestAnalytics from "../components/TestAnalytics";

export default function HomePage() {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  const searchParams = new URLSearchParams(window.location.search);
  const shopDomain = searchParams.get('shop') || 'my-test-store.myshopify.com';
  console.log("Shop Domain:", shopDomain);

  const fetch = async (url, options = {}) => {
    return window.fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  // Fetch customers and stats
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/points/customers?page=${currentPage}&limit=20`);
      const data = await response.json();
      
      if (response.ok) {
        setCustomers(data.customers);
        setStats(data.stats);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Failed to fetch data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle points adjustment
  const handlePointsAdjustment = async () => {
    if (!selectedCustomer || !adjustmentAmount) return;

    try {
      const response = await fetch('/api/points/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.shopifyCustomerId,
          points: parseInt(adjustmentAmount),
          reason: adjustmentReason || 'Admin adjustment',
          shopDomain: 'your-shop.myshopify.com'
        })
      });

      if (response.ok) {
        setShowAdjustModal(false);
        setAdjustmentAmount("");
        setAdjustmentReason("");
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error adjusting points:', error);
    }
  };

  // Format customer data for table
  const customerRows = customers.map((customer) => [
    `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email,
    customer.email,
    customer.pointsBalance.toLocaleString(),
    customer.totalPointsEarned.toLocaleString(),
    customer.totalPointsRedeemed.toLocaleString(),
    customer.totalOrders,
    new Date(customer.createdAt).toLocaleDateString(),
    <ButtonGroup key={customer._id}>
      <Button 
        size="slim" 
        onClick={() => {
          setSelectedCustomer(customer);
          setShowAdjustModal(true);
        }}
      >
        Adjust Points
      </Button>
    </ButtonGroup>
  ]);

  // Stats cards
  const StatsCard = ({ title, value, description }) => (
    <Card sectioned>
      <TextContainer>
        <DisplayText size="medium">{value?.toLocaleString() || '0'}</DisplayText>
        <Heading element="h3">{title}</Heading>
        <p>{description}</p>
      </TextContainer>
    </Card>
  );

  // Tab content
  const tabs = [
    {
      id: 'dashboard',
      content: 'Dashboard',
      panel: (
        <Layout>
          <Layout.Section>
            <Banner title="Loyalty Points System" status="success">
              <p>Your loyalty program is active and tracking customer points automatically.</p>
            </Banner>
          </Layout.Section>
          
          <Layout.Section>
            <Layout sectioned>
              <Layout.Section oneThird>
                <StatsCard 
                  title="Total Customers"
                  value={stats.totalCustomers}
                  description="Customers enrolled in loyalty program"
                />
              </Layout.Section>
              <Layout.Section oneThird>
                <StatsCard 
                  title="Points Issued"
                  value={stats.totalPointsIssued}
                  description="Total points awarded to customers"
                />
              </Layout.Section>
              <Layout.Section oneThird>
                <StatsCard 
                  title="Points Outstanding"
                  value={stats.totalPointsOutstanding}
                  description="Points available for redemption"
                />
              </Layout.Section>
            </Layout>
          </Layout.Section>

          <Layout.Section>
            <Layout sectioned>
              <Layout.Section oneHalf>
                <StatsCard 
                  title="Points Redeemed"
                  value={stats.totalPointsRedeemed}
                  description="Points used by customers"
                />
              </Layout.Section>
              <Layout.Section oneHalf>
                <StatsCard 
                  title="Redemption Rate"
                  value={stats.totalPointsIssued > 0 ? 
                    `${((stats.totalPointsRedeemed / stats.totalPointsIssued) * 100).toFixed(1)}%` : 
                    '0%'
                  }
                  description="Percentage of points redeemed"
                />
              </Layout.Section>
            </Layout>
          </Layout.Section>
        </Layout>
      )
    },
    {
      id: 'analytics',
      content: 'Analytics',
      panel: <AnalyticsDashboard shopDomain={shopDomain} />
    },
    {
      id: 'customers',
      content: 'Customers',
      panel: (
        <Layout>
          <Layout.Section>
            <Card>
              <Card.Section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Heading element="h2">Customer Points Management</Heading>
                  <TextField
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search customers..."
                    clearButton
                    onClearButtonClick={() => setSearchQuery("")}
                  />
                </div>
              </Card.Section>

              {loading ? (
                <Card.Section>
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Spinner size="large" />
                  </div>
                </Card.Section>
              ) : customers.length > 0 ? (
                <>
                  <DataTable
                    columnContentTypes={[
                      'text',     // Name
                      'text',     // Email
                      'numeric',  // Current Points
                      'numeric',  // Total Earned
                      'numeric',  // Total Redeemed
                      'numeric',  // Total Orders
                      'text',     // Joined Date
                      'text',     // Actions
                    ]}
                    headings={[
                      'Customer',
                      'Email',
                      'Current Points',
                      'Total Earned',
                      'Total Redeemed',
                      'Total Orders',
                      'Joined',
                      'Actions'
                    ]}
                    rows={customerRows}
                  />
                  
                  {totalPages > 1 && (
                    <Card.Section>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Pagination
                          label={`Page ${currentPage} of ${totalPages}`}
                          hasPrevious={currentPage > 1}
                          onPrevious={() => setCurrentPage(currentPage - 1)}
                          hasNext={currentPage < totalPages}
                          onNext={() => setCurrentPage(currentPage + 1)}
                        />
                      </div>
                    </Card.Section>
                  )}
                </>
              ) : (
                <EmptyState
                  heading="No customers found"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Customers will appear here once they start earning points from orders.</p>
                </EmptyState>
              )}
            </Card>
          </Layout.Section>
        </Layout>
      )
    },
    {
      id: 'transactions',
      content: 'Transactions',
      panel: <TransactionHistoryAdmin shopDomain="your-shop.myshopify.com" />
    },
    {
      id: 'spin-wheel',
      content: 'Spin Wheel',
      panel: <SpinWheelConfig shopDomain="your-shop.myshopify.com" />
    }
  ];

  return (
    <Page fullWidth title="Loyalty Points Dashboard">
      <Tabs tabs={tabs} selected={activeTab} onSelect={setActiveTab}>
        {tabs[activeTab].panel}
      </Tabs>

      {/* Points Adjustment Modal */}
      <Modal
        open={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title={`Adjust Points for ${selectedCustomer?.firstName || selectedCustomer?.email}`}
        primaryAction={{
          content: 'Adjust Points',
          onAction: handlePointsAdjustment,
          disabled: !adjustmentAmount
        }}
        secondaryActions={[{
          content: 'Cancel',
          onAction: () => setShowAdjustModal(false)
        }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Points Adjustment"
              type="number"
              value={adjustmentAmount}
              onChange={setAdjustmentAmount}
              placeholder="Enter positive or negative number"
              helpText="Use positive numbers to add points, negative to subtract"
            />
            <TextField
              label="Reason"
              value={adjustmentReason}
              onChange={setAdjustmentReason}
              placeholder="Optional reason for adjustment"
              multiline={2}
            />
            {selectedCustomer && (
              <p><strong>Current Balance:</strong> {selectedCustomer.pointsBalance.toLocaleString()} points</p>
            )}
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}