import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  ShieldCheck,
  Key as KeyIcon,
  ChevronDown,
  Copy, // <-- added import
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import CryptoJS from 'crypto-js';
import { useProviderStore, type Provider } from '@/store/useProviderStore';
import ProviderModal from '@/components/ProviderModal';
import ConfirmModal from '@/components/ConfirmModal';

const SALT = import.meta.env.VITE_ENCRYPTION_SALT;

// ... rest of the file remains unchanged