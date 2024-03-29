import { Button } from '@/components/ui/button'
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from '@/components/ui/card'
import {
   Form,
   FormControl,
   FormDescription,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import getVendingMachineBalance from '@/lib/methods/getVendingMachineBalance'
import purchase, { costPerDonut } from '@/lib/methods/purchase'
import { useStore } from '@/lib/store'
import { zodResolver } from '@hookform/resolvers/zod'
import { Icon } from '@iconify-icon/react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
   amount: z.number().int(),
})

export function DonutForm() {
   const { walletAddress, metamask, donuts, increaseDonuts } = useStore()
   const [transactionLoading, setTransactionLoading] = useState<boolean>(false)
   const [balanceLoading, setBalanceLoading] = useState<boolean>(false)

   const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
         amount: undefined,
      },
   })

   const [totalCost, setTotalCost] = useState<number>(0)

   async function onSubmit(values: z.infer<typeof formSchema>) {
      const response = await purchase(
         { address: walletAddress, amount: values.amount },
         { loading: setTransactionLoading }
      )

      if (response) increaseDonuts()
   }

   form.watch((value) => {
      const amount = value.amount || 0
      const cost = amount * costPerDonut
      setTotalCost(cost)
   })

   const [vendingMachineBalance, setVendingMachineBalance] = useState<number>(0)

   useEffect(() => {
      async function fetchInitialData() {
         if (metamask) {
            const donutCount = await getVendingMachineBalance({ loading: setBalanceLoading })
            setVendingMachineBalance(Number(donutCount))
         }
      }

      fetchInitialData()
   }, [metamask, donuts])

   return (
      <Card className="my-auto w-full max-w-96">
         <CardHeader>
            <CardTitle>
               <Icon icon="solar:donut-line-duotone" className="mr-1 align-middle text-2xl" />
               Donut Vending Machine
            </CardTitle>
            <CardDescription>
               {balanceLoading ? (
                  <Icon icon="line-md:loading-twotone-loop" className="align-middle text-2xl" />
               ) : (
                  vendingMachineBalance
               )}{' '}
               Remaining donuts in the machine
            </CardDescription>
         </CardHeader>
         <CardContent className="-mt-2">
            <Form {...form}>
               <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                  <FormField
                     control={form.control}
                     name="amount"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Amount</FormLabel>
                           <FormControl>
                              <Input
                                 type="number"
                                 placeholder="Number of Donuts"
                                 {...field}
                                 onChange={(e) =>
                                    field.onChange(
                                       e.target.value === '' ? undefined : Number(e.target.value)
                                    )
                                 }
                              />
                           </FormControl>
                           <FormDescription>
                              1 Donut = {costPerDonut} ETH <br />
                              Total cost: {totalCost.toFixed(4)} ETH
                           </FormDescription>
                           <FormMessage />
                        </FormItem>
                     )}
                  />
               </form>
            </Form>
         </CardContent>
         <CardFooter className="flex justify-between">
            <Button
               onClick={form.handleSubmit(onSubmit)}
               type="submit"
               disabled={
                  !metamask ||
                  totalCost === 0 ||
                  vendingMachineBalance <= 0 ||
                  !walletAddress ||
                  walletAddress === ''
               }
               className="gap-1.5"
            >
               Purchase Now
               {transactionLoading ? (
                  <Icon icon="line-md:loading-twotone-loop" className="-mr-2 text-xl" />
               ) : (
                  <Icon icon="ic:outline-payments" className="-mr-2 text-xl" />
               )}
            </Button>
         </CardFooter>
      </Card>
   )
}
