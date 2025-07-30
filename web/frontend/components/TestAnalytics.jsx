// web/frontend/components/TestAnalytics.jsx
import { useState } from 'react';
import {
  Card,
  Layout,
  Heading,
  Button,
} from '@shopify/polaris';

const TestAnalytics = ({ shopDomain }) => {
  const [result, setResult] = useState('Not tested yet');
  const [loading, setLoading] = useState(false);

  const testFetch = async () => {
  setLoading(true);
  setResult('Testing...');
  
  try {
    // Try direct backend port
    const url = `http://localhost:3000/api/points/analytics?shop=${shopDomain}&days=30`;
    console.log('🔗 Testing URL:', url);
    
    const response = await fetch(url);
    console.log('📊 Response:', response.status);
    
    const data = await response.json();
    console.log('📈 Data:', data);
    
    setResult(`Success! Got ${JSON.stringify(data)}`);
  } catch (error) {
    console.error('❌ Error:', error);
    setResult(`Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <Layout>
      <Layout.Section>
        <Card sectioned>
          <Heading>Test Analytics</Heading>
          <p>Shop: {shopDomain}</p>
          <Button onClick={testFetch} loading={loading}>
            Test API Call
          </Button>
          <p style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f6f6f7' }}>
            Result: {result}
          </p>
        </Card>
      </Layout.Section>
    </Layout>
  );
};

export default TestAnalytics;