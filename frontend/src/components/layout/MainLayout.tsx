import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '@/components/ui/ToastContainer';
import styles from './MainLayout.module.css';

export interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className={styles.layoutWrapper}>
      <Navbar />
      <div className={styles.bodyContainer}>
        <Sidebar />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};


