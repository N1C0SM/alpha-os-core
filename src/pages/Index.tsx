import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redirect to the main Today page
  return <Navigate to="/hoy" replace />;
};

export default Index;
