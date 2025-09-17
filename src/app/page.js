// app/page.js
import { redirect } from 'next/navigation'

export default function Home() {
  // por enquanto, sempre mandar pro login da UBS
  redirect('/login/ubs')
}
