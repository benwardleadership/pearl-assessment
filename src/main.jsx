import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import AuthGate from './AuthGate.jsx'
import App      from './App.jsx'
import Setup    from './views/Setup.jsx'
import Assess   from './views/Assess.jsx'
import Summary  from './views/Summary.jsx'
import Board    from './views/Board.jsx'
import Compare  from './views/Compare.jsx'
import Report   from './views/Report.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthGate><App /></AuthGate>,
    children: [
      { index: true, element: <Navigate to="/summary" replace /> },
      { path: 'setup',       element: <Setup />   },
      { path: 'assess',      element: <Assess />  },
      { path: 'summary',     element: <Summary /> },
      { path: 'board',       element: <Board />   },
      { path: 'compare',     element: <Compare /> },
      { path: 'manager/:id', element: <Report />  },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
