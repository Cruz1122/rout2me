import { useState, useRef, useEffect } from 'react';
import {
  createUser as createUserApi,
  getUsers,
  deleteUser as deleteUserApi,
  updateUser as updateUserApi,
} from '../api/users_api';
import type { User } from '../api/users_api';
import R2MTable from '../components/R2MTable';
import R2MModal from '../components/R2MModal';
import R2MButton from '../components/R2MButton';
import R2MInput from '../components/R2MInput';
import R2MActionIconButton from '../components/R2MActionIconButton';
import R2MDetailDisplay from '../components/R2MDetailDisplay';
import R2MSearchInput from '../components/R2MSearchInput';
import PageHeader from '../components/PageHeader';
import { colorClasses } from '../styles/colors';

export default function UsersPage() {
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
  }>({});

  // Data state
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast state
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
    visible: boolean;
  } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const toastHideTimerRef = useRef<number | null>(null);
  const toastEntryTimerRef = useRef<number | null>(null);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('error', 'Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }

  // Load users on mount
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeCreateModal() {
    setIsCreateOpen(false);
    setErrors({});
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
  }

  function closeEditModal() {
    setIsEditOpen(false);
    setErrors({});
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
  }

  function closeDetailsModal() {
    setIsDetailsOpen(false);
    setSelectedUser(null);
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
    };
  }, []);

  function showToast(type: 'success' | 'error', message: string) {
    // clear any existing timers
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    if (toastHideTimerRef.current) {
      clearTimeout(toastHideTimerRef.current);
      toastHideTimerRef.current = null;
    }
    if (toastEntryTimerRef.current) {
      clearTimeout(toastEntryTimerRef.current);
      toastEntryTimerRef.current = null;
    }

    // Mount toast initially hidden so we can animate its entrance
    setToast({ type, message, visible: false });
    // small delay to allow mounting, then set visible to true to trigger enter animation
    toastEntryTimerRef.current = window.setTimeout(() => {
      setToast((t) => (t ? { ...t, visible: true } : t));
      // hide after 4s (start hide animation slightly before remove)
      toastTimerRef.current = window.setTimeout(() => {
        setToast((t) => (t ? { ...t, visible: false } : t));
        // remove from DOM after animation completes
        toastHideTimerRef.current = window.setTimeout(() => {
          setToast(null);
        }, 300);
      }, 4000);
    }, 20);
  }

  async function createUser() {
    // Validate
    const newErrors: {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
    } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{10,15}$/;

    if (!email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!emailRegex.test(email)) newErrors.email = 'Email no válido';

    if (!password.trim()) newErrors.password = 'La contraseña es obligatoria';
    else if (password.length < 6)
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';

    if (!name.trim()) newErrors.name = 'El nombre es obligatorio';

    if (!phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    else if (!phoneRegex.test(phone))
      newErrors.phone = 'Teléfono no válido (ej: +573001234567)';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      await createUserApi({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          phone,
        },
      });
      showToast('success', 'Usuario creado correctamente');
      loadUsers();
      closeCreateModal();
    } catch (err) {
      console.error('create failed', err);
      showToast('error', 'Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  }

  // Validation on blur handlers
  function validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim())
      setErrors((e) => ({ ...e, email: 'El email es obligatorio' }));
    else if (!emailRegex.test(email))
      setErrors((e) => ({ ...e, email: 'Email no válido' }));
    else
      setErrors((e) => {
        const copy = { ...e };
        delete copy.email;
        return copy;
      });
  }

  function validatePassword() {
    if (!password.trim())
      setErrors((e) => ({ ...e, password: 'La contraseña es obligatoria' }));
    else if (password.length < 6)
      setErrors((e) => ({
        ...e,
        password: 'La contraseña debe tener al menos 6 caracteres',
      }));
    else
      setErrors((e) => {
        const copy = { ...e };
        delete copy.password;
        return copy;
      });
  }

  function validateName() {
    if (!name.trim())
      setErrors((e) => ({ ...e, name: 'El nombre es obligatorio' }));
    else
      setErrors((e) => {
        const copy = { ...e };
        delete copy.name;
        return copy;
      });
  }

  function validatePhone() {
    const phoneRegex = /^\+?\d{10,15}$/;
    if (!phone.trim())
      setErrors((e) => ({ ...e, phone: 'El teléfono es obligatorio' }));
    else if (!phoneRegex.test(phone))
      setErrors((e) => ({
        ...e,
        phone: 'Teléfono no válido (ej: +573001234567)',
      }));
    else
      setErrors((e) => {
        const copy = { ...e };
        delete copy.phone;
        return copy;
      });
  }

  function openEditModal(user: User) {
    setSelectedUser(user);
    setEmail(user.email);
    setName(user.name);
    setPhone(user.phone);
    setPassword('');
    setErrors({});
    setIsEditOpen(true);
  }

  function openDetailsModal(user: User) {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  }

  async function updateUser() {
    if (!selectedUser) return;

    // Validate (password optional in edit)
    const newErrors: {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
    } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{10,15}$/;

    if (!email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!emailRegex.test(email)) newErrors.email = 'Email no válido';

    if (password && password.length < 6)
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';

    if (!name.trim()) newErrors.name = 'El nombre es obligatorio';

    if (!phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    else if (!phoneRegex.test(phone))
      newErrors.phone = 'Teléfono no válido (ej: +573001234567)';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      const updatePayload: {
        email?: string;
        password?: string;
        user_metadata?: {
          name: string;
          phone: string;
        };
      } = {
        email,
        user_metadata: {
          name,
          phone,
        },
      };

      if (password.trim()) {
        updatePayload.password = password;
      }

      await updateUserApi(selectedUser.id, updatePayload);
      showToast('success', 'Usuario actualizado correctamente');
      loadUsers();
      closeEditModal();
    } catch (err) {
      console.error('update failed', err);
      showToast('error', 'Error al actualizar el usuario');
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!selectedUser) return;

    try {
      setLoading(true);
      await deleteUserApi(selectedUser.id);
      showToast('success', 'Usuario eliminado correctamente');
      setIsDeleteOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      console.error('delete failed', err);
      showToast('error', 'Error al eliminar el usuario');
    } finally {
      setLoading(false);
    }
  }

  // Table columns definition
  const tableColumns = [
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      width: '200px',
      render: (user: User) => (
        <span className={`font-medium ${colorClasses.textPrimary}`}>
          {user.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      width: '250px',
      render: (user: User) => (
        <span className="text-[#97A3B1]">{user.email}</span>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      sortable: true,
      width: '150px',
      render: (user: User) => {
        const roleColors = getRoleColors(user.role, user.is_superadmin);
        return (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-lg text-sm ${roleColors}`}
          >
            {user.is_superadmin ? 'SuperAdmin' : getRoleText(user.role)}
          </span>
        );
      },
    },
    {
      key: 'organization',
      header: 'Organización',
      sortable: true,
      width: '180px',
      render: (user: User) => (
        <span className="text-[#97A3B1]">{user.company_name || 'N/A'}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Teléfono',
      sortable: false,
      width: '150px',
      render: (user: User) => (
        <span className="text-[#97A3B1]">{user.phone || 'N/A'}</span>
      ),
    },
    {
      key: 'email_confirmed_at',
      header: 'Verificado',
      sortable: false,
      width: '120px',
      render: (user: User) => (
        <span className="text-[#97A3B1]">
          {user.email_confirmed_at ? 'Sí' : 'No'}
        </span>
      ),
    },
  ];

  // Render actions for each row
  const renderActions = (user: User) => (
    <div className="flex gap-2">
      <R2MActionIconButton
        icon="ri-eye-line"
        label="Ver detalles"
        variant="info"
        onClick={() => openDetailsModal(user)}
      />
      <R2MActionIconButton
        icon="ri-edit-line"
        label="Editar usuario"
        variant="warning"
        onClick={() => openEditModal(user)}
      />
      <R2MActionIconButton
        icon="ri-delete-bin-line"
        label="Eliminar usuario"
        variant="danger"
        onClick={() => {
          setSelectedUser(user);
          setIsDeleteOpen(true);
        }}
      />
    </div>
  );

  // Format user role text
  function getRoleText(role: string | undefined): string {
    if (!role) return 'Usuario';
    const roleLower = role.toLowerCase();
    if (roleLower === 'admin') return 'Administrador';
    if (roleLower === 'driver') return 'Conductor';
    if (roleLower === 'passenger') return 'Pasajero';
    if (roleLower === 'supervisor') return 'Supervisor';
    return 'Usuario';
  }

  // Get role colors (ordered by hierarchy)
  function getRoleColors(
    role: string | undefined,
    isSuperadmin?: boolean,
  ): string {
    if (isSuperadmin) {
      // Nivel más alto - Dorado
      return 'bg-amber-500/20 text-amber-500 font-bold';
    }
    if (!role) return 'bg-slate-500/20 text-slate-500 font-bold';
    const roleLower = role.toLowerCase();
    // Administrador - Rojo (alta autoridad)
    if (roleLower === 'admin') return 'bg-red-500/20 text-red-500 font-bold';
    // Supervisor - Naranja (autoridad media-alta)
    if (roleLower === 'supervisor')
      return 'bg-orange-500/20 text-orange-500 font-bold';
    // Conductor - Azul (autoridad operativa)
    if (roleLower === 'driver') return 'bg-blue-500/20 text-blue-500 font-bold';
    // Pasajero - Verde (sin autoridad administrativa)
    if (roleLower === 'passenger')
      return 'bg-emerald-500/20 text-emerald-500 font-bold';
    return 'bg-slate-500/20 text-slate-500 font-bold';
  }

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.phone && user.phone.toLowerCase().includes(query))
    );
  });

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-60 transform transition-all duration-300 ease-out ${
            toast.visible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-3 scale-95'
          }`}
          style={{ willChange: 'opacity, transform' }}
        >
          <div
            className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg border ${toast.type === 'success' ? 'bg-white text-gray-900 border-green-100' : 'bg-white text-gray-900 border-red-100'}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toast.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
            >
              {toast.type === 'success' ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 9v4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 17h.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate max-w-xs">
                {toast.message}
              </div>
            </div>
            <button
              className="ml-3 text-sm underline text-gray-500"
              onClick={() => setToast(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <PageHeader
        title="Usuarios"
        action={
          <R2MButton
            onClick={() => setIsCreateOpen(true)}
            variant="surface"
            size="sm"
            icon="ri-add-line"
            iconPosition="left"
          >
            Nuevo Usuario
          </R2MButton>
        }
      />

      <div className="px-6 py-5">
        {/* Search bar */}
        <div className="px-4 pt-4 pb-3">
          <R2MSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar usuarios por nombre, email o teléfono..."
          />
        </div>

        {/* Users table */}
        <div className="px-4 py-3">
          <R2MTable
            columns={tableColumns}
            data={filteredUsers}
            getRowKey={(user) => user.id}
            actions={renderActions}
            loading={loading}
            emptyMessage={
              searchQuery
                ? 'No se encontraron usuarios con ese criterio'
                : 'No hay usuarios disponibles'
            }
            defaultRowsPerPage={5}
            rowsPerPageOptions={[5, 10, 15, 20]}
          />
        </div>
      </div>

      {/* Details Modal */}
      <R2MModal
        isOpen={isDetailsOpen}
        onClose={closeDetailsModal}
        title="Detalles del Usuario"
      >
        {selectedUser && (
          <>
            <R2MDetailDisplay
              items={[
                { label: 'ID', value: selectedUser.id },
                { label: 'Nombre', value: selectedUser.name || 'N/A' },
                { label: 'Email', value: selectedUser.email },
                { label: 'Teléfono', value: selectedUser.phone || 'N/A' },
                {
                  label: 'Rol',
                  value: getRoleText(selectedUser.role),
                },
                {
                  label: 'Email Confirmado',
                  value: selectedUser.email_confirmed_at ? 'Sí' : 'No',
                },
                {
                  label: 'Fecha de Creación',
                  value: new Date(selectedUser.created_at).toLocaleString(
                    'es-ES',
                    {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  ),
                },
              ]}
            />
            <div className="flex gap-3 mt-6">
              <R2MButton
                variant="warning"
                onClick={() => {
                  closeDetailsModal();
                  openEditModal(selectedUser);
                }}
                size="md"
                icon="ri-edit-line"
                iconPosition="left"
                className="flex-1"
              >
                Editar Usuario
              </R2MButton>
              <R2MButton
                variant="danger"
                onClick={() => {
                  closeDetailsModal();
                  setIsDeleteOpen(true);
                }}
                size="md"
                icon="ri-delete-bin-line"
                iconPosition="left"
                className="flex-1"
              >
                Eliminar Usuario
              </R2MButton>
            </div>
          </>
        )}
      </R2MModal>

      {/* Create User Modal */}
      <R2MModal
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        title="Crear Nuevo Usuario"
      >
        <div className="flex flex-col gap-4">
          <R2MInput
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onValueChange={setEmail}
            onBlur={validateEmail}
            error={errors.email}
            icon="ri-mail-line"
            required
          />
          <R2MInput
            type="password"
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={password}
            onValueChange={setPassword}
            onBlur={validatePassword}
            error={errors.password}
            icon="ri-lock-password-line"
            required
          />
          <R2MInput
            type="text"
            placeholder="Nombre Completo"
            value={name}
            onValueChange={setName}
            onBlur={validateName}
            error={errors.name}
            icon="ri-user-line"
            required
          />
          <R2MInput
            type="tel"
            placeholder="Teléfono (+573001234567)"
            value={phone}
            onValueChange={setPhone}
            onBlur={validatePhone}
            error={errors.phone}
            icon="ri-phone-line"
            required
          />
        </div>
        <div className="flex gap-3 mt-6">
          <R2MButton
            variant="ghost"
            onClick={closeCreateModal}
            disabled={loading}
            size="md"
            className="flex-1"
          >
            Cancelar
          </R2MButton>
          <R2MButton
            variant="secondary"
            onClick={createUser}
            disabled={
              loading ||
              !email.trim() ||
              !password.trim() ||
              !name.trim() ||
              !phone.trim() ||
              Object.keys(errors).length > 0
            }
            loading={loading}
            size="md"
            icon="ri-user-add-line"
            iconPosition="left"
            className="flex-1"
          >
            Crear Usuario
          </R2MButton>
        </div>
      </R2MModal>

      {/* Edit User Modal */}
      <R2MModal
        isOpen={isEditOpen}
        onClose={closeEditModal}
        title="Editar Usuario"
      >
        <div className="flex flex-col gap-4">
          <R2MInput
            type="email"
            placeholder="usuario@ejemplo.com"
            value={email}
            onValueChange={setEmail}
            onBlur={validateEmail}
            error={errors.email}
            icon="ri-mail-line"
            required
          />
          <R2MInput
            type="password"
            placeholder="Nueva contraseña (opcional)"
            value={password}
            onValueChange={setPassword}
            onBlur={validatePassword}
            error={errors.password}
            icon="ri-lock-password-line"
          />
          <R2MInput
            type="text"
            placeholder="Nombre"
            value={name}
            onValueChange={setName}
            onBlur={validateName}
            error={errors.name}
            icon="ri-user-line"
            required
          />
          <R2MInput
            type="tel"
            placeholder="Teléfono (+573001234567)"
            value={phone}
            onValueChange={setPhone}
            onBlur={validatePhone}
            error={errors.phone}
            icon="ri-phone-line"
            required
          />
        </div>
        <div className="flex gap-3 mt-6">
          <R2MButton
            variant="ghost"
            onClick={closeEditModal}
            disabled={loading}
            size="md"
            className="flex-1"
          >
            Cancelar
          </R2MButton>
          <R2MButton
            variant="secondary"
            onClick={updateUser}
            disabled={
              loading ||
              !email.trim() ||
              !name.trim() ||
              !phone.trim() ||
              Object.keys(errors).length > 0
            }
            loading={loading}
            size="md"
            icon="ri-save-line"
            iconPosition="left"
            className="flex-1"
          >
            Actualizar Usuario
          </R2MButton>
        </div>
      </R2MModal>

      {/* Delete Confirmation Modal */}
      <R2MModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Eliminar Usuario"
      >
        <p className="text-gray-700 mb-6">
          ¿Estás seguro de que deseas eliminar a{' '}
          <strong>{selectedUser?.name}</strong>? Esta acción no se puede
          deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <R2MButton
            variant="ghost"
            onClick={() => setIsDeleteOpen(false)}
            disabled={loading}
            size="md"
          >
            Cancelar
          </R2MButton>
          <R2MButton
            variant="danger"
            onClick={confirmDelete}
            disabled={loading}
            loading={loading}
            size="md"
            icon="ri-delete-bin-line"
            iconPosition="left"
          >
            Eliminar
          </R2MButton>
        </div>
      </R2MModal>
    </>
  );
}
