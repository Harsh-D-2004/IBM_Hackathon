import { useState } from 'react'
import Home from './components/Home';
import './App.css'
import './index.css';


function App() {
  const [count, setCount] = useState(0)

  return (
   <div>
    <Home/>
   </div>
  )
}

export default App
