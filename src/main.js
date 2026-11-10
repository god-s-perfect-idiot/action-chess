import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { Showcase } from './scene/Showcase.tsx';
const params = new URLSearchParams(window.location.search);
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: import.meta.env.DEV && params.has('showcase') ? _jsx(Showcase, { only: params.get('showcase') || null }) : _jsx(App, {}) }));
