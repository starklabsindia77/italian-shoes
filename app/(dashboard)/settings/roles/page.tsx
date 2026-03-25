"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RefreshCcw, ShieldPlus, Edit3, Trash2 } from "lucide-react";

type CustomRole = {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
};

const AVAILABLE_PERMISSIONS = [
  { id: "dashboard.view", label: "View Dashboard" },
  { id: "products.manage", label: "Manage Products" },
  { id: "orders.view", label: "View Orders" },
  { id: "orders.edit", label: "Edit Orders" },
  { id: "customers.manage", label: "Manage Customers" },
  { id: "settings.manage", label: "Manage Settings" },
  { id: "users.manage", label: "Manage Users & Roles" },
];

export default function RoleManagementPage() {
  const [items, setItems] = React.useState<CustomRole[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<CustomRole | null>(null);

  const [formData, setFormData] = React.useState({
    name: "",
    permissions: [] as string[],
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/roles", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      setItems(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!formData.name) return toast.error("Role name is required");
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create role");
      }
      toast.success("Role created successfully");
      setIsAddOpen(false);
      resetForm();
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdate = async () => {
    if (!editingRole) return;
    try {
      const res = await fetch(`/api/roles/${editingRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update role");
      }
      toast.success("Role updated successfully");
      setIsEditOpen(false);
      setEditingRole(null);
      resetForm();
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will fail if users are assigned to this role.")) return;
    try {
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete role");
      }
      toast.success("Role deleted");
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", permissions: [] });
  };

  const togglePermission = (id: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(id)
        ? prev.permissions.filter(p => p !== id)
        : [...prev.permissions, id]
    }));
  };

  const openEdit = (role: CustomRole) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      permissions: role.permissions,
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Role Management</h1>
          <p className="text-sm text-muted-foreground">Manage custom roles and granular permissions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCcw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <ShieldPlus className="mr-2 size-4" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Custom Role</DialogTitle>
                <DialogDescription>Define a new role and its permissions.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Support Manager"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-1 gap-2 border rounded-lg p-3 max-h-60 overflow-y-auto">
                    {AVAILABLE_PERMISSIONS.map(p => (
                      <div key={p.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`perm-${p.id}`} 
                          checked={formData.permissions.includes(p.id)}
                          onCheckedChange={() => togglePermission(p.id)}
                        />
                        <label htmlFor={`perm-${p.id}`} className="text-sm font-medium leading-none cursor-pointer">
                          {p.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create Role</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Custom Roles</CardTitle>
          <CardDescription>Defined roles for your sub-users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="w-0 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      <span className="text-xs text-muted-foreground">
                        {role.permissions.join(", ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(role)}>
                          <Edit3 className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(role.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && !loading && (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No custom roles found.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setEditingRole(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>Modify permissions for {formData.name}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Role Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="grid grid-cols-1 gap-2 border rounded-lg p-3 max-h-60 overflow-y-auto">
                    {AVAILABLE_PERMISSIONS.map(p => (
                      <div key={p.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`edit-perm-${p.id}`} 
                          checked={formData.permissions.includes(p.id)}
                          onCheckedChange={() => togglePermission(p.id)}
                        />
                        <label htmlFor={`edit-perm-${p.id}`} className="text-sm font-medium leading-none cursor-pointer">
                          {p.label}
                        </label>
                      </div>
                    ))}
                  </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
