'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, KeyRound } from 'lucide-react';
import { getUserRole } from '@/lib/roles';
import type { UserRole } from '@/lib/roles';

// Mock user data based on lib/roles.ts
const mockUsers = [
    { id: 'user_1', name: 'Admin', email: 'admin@omni.com', role: 'central-admin', affiliation: 'Omni Platform'},
    { id: 'user_2', name: 'Clinic Admin', email: 'clinic-admin@omni.com', role: 'clinic-admin', affiliation: 'Omni Platform'},
    { id: 'user_3', name: 'Dr. Ashish', email: 'doc_ashish@omni.com', role: 'doctor', affiliation: 'Cardiology Dept.'},
    { id: 'user_4', name: 'Dr. Vijay', email: 'doc_vijay@omni.com', role: 'doctor', affiliation: 'Orthopedics Dept.' },
    { id: 'user_5', name: 'Sunita', email: 'asst_sunita@omni.com', role: 'assistant', affiliation: 'Cardiology Dept.' },
    { id: 'user_6', name: 'Rajesh', email: 'asst_rajesh@omni.com', role: 'assistant', affiliation: 'Orthopedics Dept.' },
    { id: 'user_7', name: 'Display User', email: 'display@omni.com', role: 'display', affiliation: 'Main Hall Display' },
    { id: 'user_8', name: 'Advertiser User', email: 'advertiser@omni.com', role: 'advertiser', affiliation: 'HealthPlus Insurance' },
];

const roleLabels: Record<UserRole, string> = {
  'central-admin': 'Central Admin',
  'clinic-admin': 'Clinic Admin',
  'doctor': 'Doctor',
  'assistant': 'Assistant',
  'display': 'Display',
  'advertiser': 'Advertiser',
}

export function UsersTab() {
  // In a real app, this would fetch user data
  const [users, setUsers] = useState(mockUsers);

  return (
     <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Platform Users</CardTitle>
          <CardDescription>Manage user accounts and roles.</CardDescription>
        </div>
        <Button>Register User</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Affiliation</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell>{user.affiliation}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{roleLabels[user.role as UserRole] || 'Unknown'}</Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                   <Button variant="outline" size="icon">
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
