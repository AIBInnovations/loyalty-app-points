// web/frontend/components/AnalyticsDashboard.jsx
import config from '../config/index.js';
import { useState, useEffect } from 'react';
import {
  Card,
  Layout,
  Heading,
  DisplayText,
  TextContainer,
  Spinner,
  Badge,
  DataTable,
  Select,
  Button,
} from '@shopify/polaris';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AnalyticsDashboard = ({ shopDomain }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      console.log('🔍 Fetching analytics for:', shopDomain);
      
      const response = await fetch(`${config.API_BASE_URL}/api/points/analytics?shop=${shopDomain}&days=${timeRange}`);
      console.log('📊 Analytics response status:', response.status);
      
      const data = await response.json();
      console.log('📈 Analytics data:', data);
      
      if (response.ok) {
        setAnalytics(data);
      } else {
        console.error('Analytics API error:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopDomain) {
      setLoading(true); // Reset loading when timeRange changes
      fetchAnalytics();
    }
  }, [shopDomain, timeRange]);

  const timeRangeOptions = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
    { label: 'Last 365 days', value: '365' },
  ];

  // Chart colors
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  if (loading) {
    return (
      <Card sectioned>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner size="large" />
          <p>Loading analytics...</p>
          <p style={{ fontSize: '12px' }}>Shop: {shopDomain}</p>
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card sectioned>
        <Heading>Analytics not available</Heading>
        <p>Failed to load analytics data. Check console for errors.</p>
        <Button onClick={fetchAnalytics}>Retry</Button>
      </Card>
    );
  }

  return (
    <Layout>
      {/* Time Range Selector */}
      <Layout.Section>
        <Card sectioned>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Heading element="h2">Loyalty Program Analytics</Heading>
            <div style={{ width: '200px' }}>
              <Select
                label="Time Range"
                options={timeRangeOptions}
                value={timeRange}
                onChange={setTimeRange}
              />
            </div>
          </div>
        </Card>
      </Layout.Section>

      {/* Key Metrics */}
      <Layout.Section>
        <Layout sectioned>
          <Layout.Section oneThird>
            <Card sectioned>
              <TextContainer>
                <DisplayText size="large">{analytics.totalCustomers?.toLocaleString() || 0}</DisplayText>
                <Heading element="h3">Active Customers</Heading>
                <p>Enrolled in loyalty program</p>
              </TextContainer>
            </Card>
          </Layout.Section>
          
          <Layout.Section oneThird>
            <Card sectioned>
              <TextContainer>
                <DisplayText size="large">₹{analytics.totalValue?.toLocaleString() || 0}</DisplayText>
                <Heading element="h3">Points Value</Heading>
                <p>Outstanding points value</p>
              </TextContainer>
            </Card>
          </Layout.Section>
          
          <Layout.Section oneThird>
            <Card sectioned>
              <TextContainer>
                <DisplayText size="large">{analytics.engagementRate || 0}%</DisplayText>
                <Heading element="h3">Engagement Rate</Heading>
                <p>Customers actively using program</p>
              </TextContainer>
            </Card>
          </Layout.Section>
        </Layout>
      </Layout.Section>

      {/* Points Over Time Chart */}
      <Layout.Section>
        <Card sectioned>
          <Heading element="h3">Points Activity Over Time</Heading>
          <div style={{ height: '400px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailyActivity || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="pointsEarned"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Points Earned"
                />
                <Area
                  type="monotone"
                  dataKey="pointsRedeemed"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Points Redeemed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Layout.Section>

      {/* Customer Segments */}
      <Layout.Section>
        <Layout sectioned>
          <Layout.Section oneHalf>
            <Card sectioned>
              <Heading element="h3">Customer Segments</Heading>
              <div style={{ height: '300px', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.customerSegments || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {(analytics.customerSegments || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Layout.Section>
          
          <Layout.Section oneHalf>
            <Card sectioned>
              <Heading element="h3">Redemption Methods</Heading>
              <div style={{ height: '300px', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.redemptionMethods || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Layout.Section>

      {/* Top Customers */}
      <Layout.Section>
        <Card>
          <Card.Section>
            <Heading element="h3">Top Customers</Heading>
          </Card.Section>
          
          {analytics.topCustomers?.length > 0 ? (
            <DataTable
              columnContentTypes={['text', 'numeric', 'numeric', 'numeric', 'text']}
              headings={['Customer', 'Total Points Earned', 'Points Balance', 'Total Orders', 'Status']}
              rows={analytics.topCustomers.map(customer => [
                customer.name || customer.email,
                customer.totalPointsEarned.toLocaleString(),
                customer.pointsBalance.toLocaleString(),
                customer.totalOrders,
                <Badge key={customer._id} status={customer.pointsBalance > 500 ? 'success' : 'info'}>
                  {customer.pointsBalance > 500 ? 'VIP' : 'Active'}
                </Badge>
              ])}
            />
          ) : (
            <Card.Section>
              <p>No customer data available for this time period.</p>
            </Card.Section>
          )}
        </Card>
      </Layout.Section>

      {/* Recent Activity */}
      <Layout.Section>
        <Card>
          <Card.Section>
            <Heading element="h3">Recent Activity</Heading>
          </Card.Section>
          
          {analytics.recentActivity?.length > 0 ? (
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'numeric', 'text']}
              headings={['Date', 'Customer', 'Activity', 'Points', 'Type']}
              rows={analytics.recentActivity.map(activity => [
                new Date(activity.createdAt).toLocaleDateString(),
                activity.customerEmail,
                activity.description,
                activity.points > 0 ? `+${activity.points}` : activity.points,
                <Badge key={activity._id} status={activity.points > 0 ? 'success' : 'warning'}>
                  {activity.type}
                </Badge>
              ])}
            />
          ) : (
            <Card.Section>
              <p>No recent activity to display.</p>
            </Card.Section>
          )}
        </Card>
      </Layout.Section>
    </Layout>
  );
};

export default AnalyticsDashboard;