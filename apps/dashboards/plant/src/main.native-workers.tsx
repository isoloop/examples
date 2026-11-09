import { createRoot } from 'react-dom/client';
import { Page } from './page';
import './page.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
createRoot(root).render(<Page />);
