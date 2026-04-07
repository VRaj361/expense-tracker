import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Bot, Trash2, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select } from '../components/ui/select';
import { EmptyState } from '../components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { automationAPI } from '../services/api';
import type { AutomationRule, VendorMapping } from '../types';

const ruleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  conditionField: z.string().default('vendor'),
  conditionOperator: z.string().default('contains'),
  conditionValue: z.string().min(1, 'Condition value is required'),
  actionType: z.string().default('set_category'),
  actionValue: z.string().min(1, 'Action value is required'),
});

type RuleForm = z.input<typeof ruleSchema>;

export function AutomationPage() {
  const [ruleDialog, setRuleDialog] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '', conditionField: 'vendor', conditionOperator: 'contains', conditionValue: '',
      actionType: 'set_category', actionValue: '',
    },
  });

  const { data: rules = [] } = useQuery<AutomationRule[]>({
    queryKey: ['automation-rules'],
    queryFn: () => automationAPI.getRules().then((r) => r.data),
  });

  const { data: mappings = [] } = useQuery<VendorMapping[]>({
    queryKey: ['vendor-mappings'],
    queryFn: () => automationAPI.getMappings().then((r) => r.data),
  });

  const createRule = useMutation({
    mutationFn: (data: any) => automationAPI.createRule({
      name: data.name,
      condition: { field: data.conditionField, operator: data.conditionOperator, value: data.conditionValue },
      action: { type: data.actionType, value: data.actionValue },
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automation-rules'] }); toast.success('Rule created'); setRuleDialog(false); reset(); },
  });

  const deleteRule = useMutation({
    mutationFn: (id: string) => automationAPI.deleteRule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation-rules'] }),
  });

  const deleteMapping = useMutation({
    mutationFn: (id: string) => automationAPI.deleteMapping(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-mappings'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Automation</h1>
        <Button onClick={() => setRuleDialog(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Add Rule</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" /> Automation Rules</CardTitle></CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <EmptyState icon={<Bot className="h-10 w-10" />} title="No rules" description="Create automation rules to auto-categorize expenses." />
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule._id} className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--accent))]/50">
                  <div>
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      If <Badge variant="outline" className="mx-1 text-[10px]">{rule.condition.field}</Badge>
                      {rule.condition.operator}
                      <Badge variant="outline" className="mx-1 text-[10px]">{rule.condition.value}</Badge>
                      → {rule.action.type}: {rule.action.value}
                    </p>
                  </div>
                  <button onClick={() => deleteRule.mutate(rule._id)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--destructive))] cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Learned Vendor Mappings</CardTitle></CardHeader>
        <CardContent>
          {mappings.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">No mappings yet. The system learns when you categorize vendors.</p>
          ) : (
            <div className="space-y-1">
              {mappings.map((m) => (
                <div key={m._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[hsl(var(--accent))]/50">
                  <span className="text-sm"><span className="font-medium">{m.vendorPattern}</span> → {m.categoryName}</span>
                  <button onClick={() => deleteMapping.mutate(m._id)} className="p-1 cursor-pointer text-[hsl(var(--destructive))]"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={ruleDialog} onOpenChange={setRuleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Automation Rule</DialogTitle>
            <DialogDescription>Set up rules to automatically process transactions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createRule.mutate(d))} className="space-y-4">
            <div>
              <Input placeholder="Rule name" {...register('name')} />
              {errors.name && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.name.message}</p>}
            </div>
            <p className="text-sm font-medium">Condition</p>
            <div className="grid grid-cols-3 gap-2">
              <Select options={[
                { value: 'vendor', label: 'Vendor' }, { value: 'amount', label: 'Amount' },
                { value: 'description', label: 'Description' }, { value: 'categoryName', label: 'Category' },
              ]} {...register('conditionField')} />
              <Select options={[
                { value: 'equals', label: 'Equals' }, { value: 'contains', label: 'Contains' },
                { value: 'greater_than', label: 'Greater than' }, { value: 'less_than', label: 'Less than' },
              ]} {...register('conditionOperator')} />
              <div>
                <Input placeholder="Value" {...register('conditionValue')} />
                {errors.conditionValue && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.conditionValue.message}</p>}
              </div>
            </div>
            <p className="text-sm font-medium">Action</p>
            <div className="grid grid-cols-2 gap-2">
              <Select options={[
                { value: 'set_category', label: 'Set Category' }, { value: 'set_type', label: 'Set Type' },
                { value: 'notify', label: 'Send Notification' },
              ]} {...register('actionType')} />
              <div>
                <Input placeholder="Value" {...register('actionValue')} />
                {errors.actionValue && <p className="text-xs text-[hsl(var(--destructive))] mt-1">{errors.actionValue.message}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRuleDialog(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
