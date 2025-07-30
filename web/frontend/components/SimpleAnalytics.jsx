// web/frontend/components/SimpleAnalytics.jsx
import { useState, useEffect } from 'react';
import {
  Card,
  Layout,
  Heading,
  Spinner,
  TextContainer,
} from '@shopify/polaris';

const SimpleAnalytics = ({ shopDomain }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 SimpleAnalytics mounted, shopDomain:', shopDomain);
    
    const fetchData = async () => {
  try {
    console.log('📡 Fetching analytics...');
    const url = `https://3c2cb21bd1f4.ngrok-free.app/api/points/analytics?shop=${shopDomain}&days=30`;
    console.log('🔗 Full URL:', url);
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📈 Analytics data:', result);
    
    setData(result);
    setError(null);
  } catch (error) {
    console.error('❌ Analytics error:', error);
    if (error.name === 'AbortError') {
      setError('Request timeout - check network connection');
    } else {
      setError(error.message);
    }
  } finally {
    console.log('🏁 Setting loading to false');
    setLoading(false);
  }
};

    if (shopDomain) {
      fetchData();
    } else {
      console.log('❌ No shopDomain provided');
      setLoading(false);
    }
  }, [shopDomain]);

  console.log('🔄 Render state:', { loading, data: !!data, error });

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

  if (error) {
    return (
      <Card sectioned>
        <Heading>Error Loading Analytics</Heading>
        <p>Error: {error}</p>
      </Card>
    );
  }

  return (
    <Layout>
      <Layout.Section>
        <Card sectioned>
          <Heading>✅ Analytics Dashboard</Heading>
          <TextContainer>
            <p>Shop Domain: {shopDomain}</p>
            <p>Total Customers: {data?.totalCustomers || 0}</p>
            <p>Total Points Issued: {data?.totalPointsIssued || 0}</p>
            <p>Data loaded successfully!</p>
          </TextContainer>
        </Card>
      </Layout.Section>
    </Layout>
  );
};

export default SimpleAnalytics;