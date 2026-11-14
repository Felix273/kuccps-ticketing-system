// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CsatFeedbackPage } from './components/feedback/CsatFeedbackPage.jsx'
import './index.css'

const searchParams = new URLSearchParams(window.location.search)
const hasCsatToken = searchParams.has('csatToken')
const csatToken = searchParams.get('csatToken')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {hasCsatToken ? <CsatFeedbackPage token={csatToken} /> : <App />}
    </BrowserRouter>
  </React.StrictMode>,
)
