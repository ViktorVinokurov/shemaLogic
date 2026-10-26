<script setup lang="ts">
import { PlusIcon } from '@lucide/vue'
import { useId, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSchemeStore } from '@/entities/scheme'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

const store = useSchemeStore()
const router = useRouter()
const open = ref(false)
const name = ref('')
const error = ref('')
const isSubmitting = ref(false)
const nameId = useId()

watch(open, (isOpen) => {
  if (isOpen) return
  name.value = ''
  error.value = ''
})

async function submit() {
  const nextName = name.value.trim()
  if (!nextName || isSubmitting.value) return

  isSubmitting.value = true
  error.value = ''
  try {
    const scheme = await store.createScheme(nextName)
    open.value = false
    await router.push({ name: 'scheme', params: { id: String(scheme.id) } })
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось создать схему.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Button
    type="button"
    size="icon"
    aria-label="Создать схему"
    @click="open = true"
  >
    <PlusIcon />
  </Button>

  <Dialog v-model:open="open">
    <DialogContent>
      <form class="grid gap-4" @submit.prevent="submit">
        <DialogHeader>
          <DialogTitle>Новая схема</DialogTitle>
          <DialogDescription>Введите название, и справа откроется пустой холст.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-2">
          <Label :for="nameId">Название</Label>
          <Input
            :id="nameId"
            v-model="name"
            maxlength="255"
            autocomplete="off"
            placeholder="Например, Оплата заказа"
            :disabled="isSubmitting"
          />
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" :disabled="isSubmitting" @click="open = false">
            Отмена
          </Button>
          <Button type="submit" :disabled="isSubmitting || !name.trim()">
            Создать
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
