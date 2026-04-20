'use client'
import { useState } from "react";
import {
  LayoutDashboard,
  Database,
  Cpu,
  UserCircle,
  Code2,
  Settings2,
  Bot,
  ChevronsUpDown,
  Plus,
  Check,
  MessagesSquare,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAssistant } from "@/contexts/AssistantContext";
import { toast } from "sonner";

const navItems = [
  { title: "Overview", url: "/overview", icon: LayoutDashboard },
  { title: "Knowledge Base", url: "/knowledge", icon: Database },
  { title: "Model Settings", url: "/models", icon: Cpu },
  { title: "Avatar Settings", url: "/avatar", icon: UserCircle },
  { title: "Deployment", url: "/deployment", icon: Code2 },
  { title: "Chat", url: "/chat", icon: MessagesSquare },
  { title: "Settings", url: "/settings", icon: Settings2 },
];

const TEMP_ENABLED_NAV_TITLE = "Chat";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();
  const { assistants, current, switchAssistant, createAssistant } = useAssistant();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    createAssistant(newName.trim(), newDesc.trim());
    setNewName("");
    setNewDesc("");
    setCreateOpen(false);
    toast.success(`Assistant "${newName.trim()}" created`);
  };

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="border-r border-outline-variant/35 bg-surface-container-low text-on-surface shadow-[4px_0_24px_-12px_rgba(15,23,42,0.12)]"
      >
        <SidebarContent>
          <div className="px-4 pt-4 pb-1">
            <div className="font-headline text-base font-bold tracking-tight text-on-surface">
              ENB Avatars
            </div>
            {!collapsed && (
              <p className="mt-0.5 text-[11px] text-on-surface-variant">
                Vocal AI Avatar Assistant
              </p>
            )}
          </div>

          {/* Assistant Switcher */}
          <div className="px-3 pt-4 pb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-left hover:bg-surface-container-high transition-colors shadow-xs">
                  <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/10 shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  {!collapsed && (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{current.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {current.description?.trim() || "Default assistant"}
                        </p>
                      </div>
                      <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {assistants.map((a) => (
                  <DropdownMenuItem
                    key={a.id}
                    onClick={() => {
                      switchAssistant(a.id);
                      toast.success(`Switched to ${a.name}`);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate">{a.name}</span>
                    {a.id === current.id && <Check className="h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Assistant</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <SidebarGroup className="py-2">
            <SidebarGroupLabel className="px-4 font-label text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">
              {!collapsed && "Navigation"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isTemporarilyEnabled = item.title === TEMP_ENABLED_NAV_TITLE;
                  const isActive =
                    item.url === "/"
                      ? pathname === "/"
                      : pathname === item.url || pathname.startsWith(`${item.url}/`);

                  return (
                    <SidebarMenuItem key={item.title}>
                      {isTemporarilyEnabled ? (
                        <SidebarMenuButton asChild isActive={isActive}>
                          <NavLink
                            href={item.url}
                            end={item.url === "/"}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-150"
                            activeClassName="bg-surface-container-highest text-on-surface font-medium"
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          disabled
                          isActive={false}
                          className="cursor-not-allowed opacity-45 hover:bg-transparent hover:text-on-surface-variant"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Create Assistant Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Assistant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm">Name <span className="text-destructive">*</span></Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Sales Bot"
                className="bg-background border-border"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What does this assistant do?"
                className="h-20 resize-none bg-background border-border"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AppSidebar;
