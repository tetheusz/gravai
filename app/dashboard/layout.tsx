/**
 * Copyright 2026 Circle Internet Group, Inc.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { logout } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { TopBarGatewayControls } from "@/components/dashboard/top-bar-gateway-controls";
import { LanguageSwitch } from "@/components/language-switch";
import { LogOut, Orbit } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/80 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="mr-4 flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Orbit size={17} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">GravAI</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Data commerce
              </p>
            </div>
          </div>
          <TopBarGatewayControls />
          <div className="flex items-center gap-2">
            <LanguageSwitch variant="light" />
            <form action={logout}>
              <Button variant="ghost" size="icon" type="submit">
                <LogOut size={16} className="text-muted-foreground" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
