import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Header, Footer } from '@/components/Chrome';
import { CabinetNav } from '@/components/cabinet/CabinetNav';
import { SESSION_COOKIE } from '@/lib/server/session';

/**
 * Keeps signed-out visitors off the cabinet shell so they get the login screen instead of a
 * page full of failed requests.
 *
 * This is a routing convenience, not the access control: the cookie is only checked for
 * presence here. Whether it is a real, unexpired session for a user who is still allowed to
 * trade is decided by the backend on every single request behind `/api/me`.
 */
export default function CabinetLayout({ children }: { children: React.ReactNode }) {
  if (!cookies().get(SESSION_COOKIE)?.value) redirect('/kirish?next=/kabinet');

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <CabinetNav />
        {children}
      </main>
      <Footer />
    </>
  );
}
